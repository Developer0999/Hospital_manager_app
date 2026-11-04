package com.hospital.controller;

import com.hospital.entity.Appointment;
import com.hospital.repository.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentController.class);

    @Autowired
    private AppointmentRepository repo;

    @GetMapping
    public List<Appointment> getAll() {
        logger.info("Fetching all appointments");
        return repo.findAll();
    }
   

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getById(@PathVariable Long id) {
        logger.info("Fetching appointment with id={}", id);
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/hospital/{hospitalId}")
    public List<Appointment> getByHospital(@PathVariable Long hospitalId) {
        return repo.findByHospitalId(hospitalId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getByDoctor(@PathVariable Long doctorId) {
        return repo.findByDoctorId(doctorId);
    }

    @GetMapping("/customer/{customerId}")
    public List<Appointment> getByCustomer(@PathVariable Long customerId) {
        return repo.findByCustomerId(customerId);
    }

    @GetMapping("/hospital/{hospitalId}/date/{date}")
    public List<Appointment> getByHospitalAndDate(@PathVariable Long hospitalId,
                                                   @PathVariable String date) {
        return repo.findByHospitalIdAndAppointmentDate(hospitalId, date);
    }

    @PostMapping
    public Appointment save(@RequestBody Appointment a) {
        logger.info("Creating appointment for customerId={} hospitalId={}", a.getCustomerId(), a.getHospitalId());
        if (a.getStatus() == null || a.getStatus().isBlank()) {
            a.setStatus("Pending");
        }
        return repo.save(a);
    }

    @PutMapping("/{id}")
    public Appointment update(@PathVariable Long id, @RequestBody Appointment a) {
        logger.info("Updating appointment id={}", id);
        a.setAppointmentId(id);
        return repo.save(a);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Long id,
                                                    @RequestParam String status) {
        logger.info("Updating appointment status id={} to {}", id, status);
        return repo.findById(id)
                .map(appointment -> {
                    appointment.setStatus(status);
                    return ResponseEntity.ok(repo.save(appointment));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        logger.info("Deleting appointment id={}", id);
        repo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
