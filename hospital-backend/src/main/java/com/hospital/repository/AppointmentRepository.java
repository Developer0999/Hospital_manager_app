package com.hospital.repository;

import com.hospital.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByHospitalId(Long hospitalId);
    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByCustomerId(Long customerId);
    List<Appointment> findByHospitalIdAndAppointmentDate(Long hospitalId, String date);
}
