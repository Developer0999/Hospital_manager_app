package com.hospital.controller;

import com.hospital.entity.Medicine;
import com.hospital.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/medicine")
@CrossOrigin(origins = "*")
public class MedicineController {

    @Autowired
    private MedicineService service;

    // Create
    @PostMapping
    public ResponseEntity<Medicine> save(@RequestBody Medicine medicine) {
        return ResponseEntity.ok(service.save(medicine));
    }

    // All medicines for a hospital
    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<List<Medicine>> byHospital(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(service.findByHospital(hospitalId));
    }
    @GetMapping()
    public ResponseEntity<List<Medicine>> ALLMedicine(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(service.findByHospital(hospitalId));
    }

    // Search by name (used for autocomplete in prescription form)
    @GetMapping("/hospital/{hospitalId}/search")
    public ResponseEntity<List<Medicine>> search(
            @PathVariable Long hospitalId,
            @RequestParam String name) {
        return ResponseEntity.ok(service.search(hospitalId, name));
    }

    // Filter by category
    @GetMapping("/hospital/{hospitalId}/category/{category}")
    public ResponseEntity<List<Medicine>> byCategory(
            @PathVariable Long hospitalId,
            @PathVariable String category) {
        return ResponseEntity.ok(service.findByCategory(hospitalId, category));
    }

    // Get single
    @GetMapping("/{id}")
    public ResponseEntity<Medicine> findById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update
    @PutMapping("/{id}")
    public ResponseEntity<Medicine> update(@PathVariable Long id,
                                           @RequestBody Medicine medicine) {
        return ResponseEntity.ok(service.update(id, medicine));
    }

    // Soft delete (sets active=false)
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Medicine deactivated successfully");
    }

    // Hard delete
    @DeleteMapping("/{id}/hard")
    public ResponseEntity<String> hardDelete(@PathVariable Long id) {
        service.hardDelete(id);
        return ResponseEntity.ok("Medicine permanently deleted");
    }
}
