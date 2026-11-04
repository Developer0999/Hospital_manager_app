package com.hospital.service;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hospital.entity.Medicine;
import com.hospital.repository.MedicineRepository;

@Service
public class MedicineService {

    private static final Logger logger = LoggerFactory.getLogger(MedicineService.class);

    @Autowired
    private MedicineRepository repo;

    public Medicine save(Medicine m) {
        logger.info("Saving medicine {} for hospital {}", m.getMedicineName(), m.getHospitalId());
        if (m.getActive() == null) m.setActive(true);
        return repo.save(m);
    }

    public Medicine update(Long id, Medicine m) {
        logger.info("Updating medicine id={}", id);
        Medicine ex = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found: " + id));
        ex.setMedicineName(m.getMedicineName());
        ex.setGenericName(m.getGenericName());
        ex.setCategory(m.getCategory());
        ex.setType(m.getType());
        ex.setManufacturer(m.getManufacturer());
        ex.setComposition(m.getComposition());
        ex.setPrice(m.getPrice());
        ex.setUnit(m.getUnit());
        if (m.getActive() != null) ex.setActive(m.getActive());
        return repo.save(ex);
    }

    public List<Medicine> findByHospital(Long hospitalId) {
        return repo.findByHospitalIdAndActiveTrue(hospitalId);
    }

    public List<Medicine> search(Long hospitalId, String name) {
        return repo.findByHospitalIdAndMedicineNameContainingIgnoreCaseAndActiveTrue(hospitalId, name);
    }

    public List<Medicine> findByCategory(Long hospitalId, String category) {
        return repo.findByHospitalIdAndCategoryAndActiveTrue(hospitalId, category);
    }

    public Optional<Medicine> findById(Long id) {
        return repo.findById(id);
    }

    public void delete(Long id) {
        logger.info("Deactivating medicine id={}", id);
        repo.findById(id).ifPresent(m -> {
            m.setActive(false);
            repo.save(m);
        });
    }

    public void hardDelete(Long id) {
        logger.info("Hard deleting medicine id={}", id);
        repo.deleteById(id);
    }
}
