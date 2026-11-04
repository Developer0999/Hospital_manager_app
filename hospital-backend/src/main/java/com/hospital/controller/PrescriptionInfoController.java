package com.hospital.controller;

import com.hospital.entity.PrescriptionInfo;
import com.hospital.service.PrescriptionInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/prescription/info")
@CrossOrigin(origins = "*")
public class PrescriptionInfoController {

    @Autowired
    private PrescriptionInfoService service;

    @GetMapping("/{doctorId}")
    public ResponseEntity<PrescriptionInfo> getByDoctor(@PathVariable Long doctorId) {
        PrescriptionInfo info = service.findByDoctor(doctorId)
                .orElseGet(() -> {
                    PrescriptionInfo empty = new PrescriptionInfo();
                    empty.setDoctorId(doctorId);
                    return empty;
                });
                System.out.println("PrescriptionInfoController.getByDoctor: doctorId=" + doctorId + ", info=" + info);
        return ResponseEntity.ok(info);
    }

    @PostMapping
    public ResponseEntity<PrescriptionInfo> create(@RequestBody PrescriptionInfo info) {
        return ResponseEntity.ok(service.save(info));
    }

    @PutMapping("/{doctorId}")
    public ResponseEntity<PrescriptionInfo> update(@PathVariable Long doctorId,
                                                   @RequestBody PrescriptionInfo info) {
        return ResponseEntity.ok(service.upsertByDoctor(doctorId, info));
    }
}
