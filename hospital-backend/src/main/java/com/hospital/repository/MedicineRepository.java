package com.hospital.repository;

import com.hospital.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByHospitalIdAndActiveTrue(Long hospitalId);
    List<Medicine> findByHospitalIdAndMedicineNameContainingIgnoreCaseAndActiveTrue(Long hospitalId, String name);
    List<Medicine> findByHospitalIdAndCategoryAndActiveTrue(Long hospitalId, String category);
    List<Medicine> findByHospitalIdAndTypeAndActiveTrue(Long hospitalId, String type);
}
