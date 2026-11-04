package com.hospital.controller;

import com.hospital.entity.User;
import com.hospital.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository repo;

    @GetMapping
    public List<User> getAll() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** All staff for a hospital */
    @GetMapping("/hospital/{hospitalId}")
    public List<User> getByHospital(@PathVariable Long hospitalId) {
        return repo.findByHospitalIdAndDeletedFalse(hospitalId);
    }

    /** Staff filtered by role (DOCTOR / RECEPTIONIST / ADMIN) */
    @GetMapping("/hospital/{hospitalId}/role/{role}")
    public List<User> getByRole(@PathVariable Long hospitalId,
                                @PathVariable String role) {
        return repo.findByHospitalIdAndRoleAndDeletedFalse(hospitalId, role);
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody User u) {
        if (u.getEmail() != null && repo.findByEmail(u.getEmail()).isPresent()&&(u.getContact() != null && repo.findByContact(u.getContact()).isPresent())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email already in use."));
        }else{
            if (u.getContact() != null && repo.findByContact(u.getContact()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Email or Contact already in use."));
            }
        }
        if (u.getCreatedDate() == null) {
            u.setCreatedDate(LocalDate.now());
        }
        return ResponseEntity.ok(repo.save(u));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody User u) {
        // if password is blank (edit mode), keep existing password
        if (u.getPassword() == null || u.getPassword().isBlank()) {
            repo.findById(id).ifPresent(existing -> u.setPassword(existing.getPassword()));
        }
        u.setUserId(id);
        return ResponseEntity.ok(repo.save(u));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.findById(id).ifPresent(u -> {
            u.setDeleted(true);
            u.setActive(false);
            repo.save(u);
        });
        return ResponseEntity.ok().build();
    }
}
