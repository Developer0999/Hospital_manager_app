package com.hospital.repository;

import com.hospital.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByHospitalIdOrderByPrescriptionDateDesc(Long hospitalId);
    List<Prescription> findByDoctorIdOrderByPrescriptionDateDesc(Long doctorId);
    List<Prescription> findByCustomerIdOrderByPrescriptionDateDesc(Long customerId);
    List<Prescription> findByHospitalIdAndCustomerIdOrderByPrescriptionDateDesc(Long hospitalId, Long customerId);
    List<Prescription> findByAppointmentId(Long appointmentId);
    long countByHospitalId(Long hospitalId);
    long countByDoctorId(Long doctorId);
}
