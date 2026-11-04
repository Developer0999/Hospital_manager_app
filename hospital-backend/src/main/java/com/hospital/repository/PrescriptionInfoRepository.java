package com.hospital.repository;

import com.hospital.entity.PrescriptionInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrescriptionInfoRepository extends JpaRepository<PrescriptionInfo, Long> {
    Optional<PrescriptionInfo> findByDoctorId(Long doctorId);
}
