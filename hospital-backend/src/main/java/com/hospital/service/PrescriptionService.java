package com.hospital.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hospital.entity.Prescription;
import com.hospital.repository.PrescriptionRepository;

@Service
public class PrescriptionService {

    private static final Logger logger = LoggerFactory.getLogger(PrescriptionService.class);

    @Autowired
    private PrescriptionRepository repo;

    public Prescription save(Prescription p) {
        logger.info("Saving prescription for patient {}", p.getPatientName());
        p.setRegistrationDate(LocalDate.now());
        if (p.getPrescriptionDate() == null) p.setPrescriptionDate(LocalDate.now());
        if (p.getStatus() == null) p.setStatus("Active");
        return repo.save(p);
    }

    public Prescription update(Long id, Prescription p) {
        logger.info("Updating prescription id={}", id);
        Prescription ex = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found: " + id));
        ex.setPatientName(p.getPatientName());
        ex.setPatientAge(p.getPatientAge());
        ex.setPatientGender(p.getPatientGender());
        ex.setPatientContact(p.getPatientContact());
        ex.setPatientAddress(p.getPatientAddress());
        ex.setBloodGroup(p.getBloodGroup());
        ex.setBloodPressure(p.getBloodPressure());
        ex.setWeight(p.getWeight());
        ex.setTemperature(p.getTemperature());
        ex.setPulseRate(p.getPulseRate());
        ex.setOxygenLevel(p.getOxygenLevel());
        ex.setComplaints(p.getComplaints());
        ex.setDiagnosis(p.getDiagnosis());
        ex.setInstructions(p.getInstructions());
        ex.setMedicalInstructions(p.getMedicalInstructions());
        ex.setPatientNotes(p.getPatientNotes());
        ex.setReportUrl(p.getReportUrl());
        ex.setReportName(p.getReportName());
        if (p.getReportFilesJson() != null) ex.setReportFilesJson(p.getReportFilesJson());
        ex.setFollowUpDate(p.getFollowUpDate());
        ex.setTemplateType(p.getTemplateType());
        ex.setMedicinesJson(p.getMedicinesJson());
        if (p.getStatus() != null) ex.setStatus(p.getStatus());
        if (p.getPrescriptionDate() != null) ex.setPrescriptionDate(p.getPrescriptionDate());
        return repo.save(ex);
    }

    public List<Prescription> findByHospital(Long hospitalId) {
        return repo.findByHospitalIdOrderByPrescriptionDateDesc(hospitalId);
    }

    public List<Prescription> findByDoctor(Long doctorId) {
        return repo.findByDoctorIdOrderByPrescriptionDateDesc(doctorId);
    }

    // Patient history
    public List<Prescription> findByCustomer(Long customerId) {
        return repo.findByCustomerIdOrderByPrescriptionDateDesc(customerId);
    }

    public List<Prescription> findByHospitalAndCustomer(Long hospitalId, Long customerId) {
        return repo.findByHospitalIdAndCustomerIdOrderByPrescriptionDateDesc(hospitalId, customerId);
    }

    public List<Prescription> findByAppointment(Long appointmentId) {
        return repo.findByAppointmentId(appointmentId);
    }

    public Optional<Prescription> findById(Long id) {
        return repo.findById(id);
    }

    public void delete(Long id) {
        logger.info("Cancelling prescription id={}", id);
        repo.findById(id).ifPresent(p -> {
            p.setStatus("Cancelled");
            repo.save(p);
        });
    }

    public long countByHospital(Long hospitalId) {
        logger.info("Counting prescriptions for hospital {}", hospitalId);
        return repo.countByHospitalId(hospitalId);
    }

    public long countByDoctor(Long doctorId) {
        return repo.countByDoctorId(doctorId);
    }
}
