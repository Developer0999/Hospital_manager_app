package com.hospital.controller;

import com.hospital.entity.Hospital;
import com.hospital.entity.User;
import com.hospital.repository.HospitalRepository;
import com.hospital.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private HospitalRepository hospitalRepo;

    @Autowired
    private UserRepository userRepo;

    private Optional<Hospital> resolveDemoHospital(String email, String password) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        String normalizedPassword = password == null ? "" : password.trim();

        if ("admin@hospital.com".equals(normalizedEmail) && "admin123".equals(normalizedPassword)) {
            return hospitalRepo.findByEmail("Anandi@gmail.com");
        }

        return Optional.empty();
    }

    private Optional<User> resolveDemoUser(String email, String password) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        String normalizedPassword = password == null ? "" : password.trim();

        if ("doctor@hospital.com".equals(normalizedEmail) && "doctor123".equals(normalizedPassword)) {
            return userRepo.findByEmail("tushar@gmail.com");
        }

        if ("reception@hospital.com".equals(normalizedEmail) && "recept123".equals(normalizedPassword)) {
            return userRepo.findByEmail("Ashwini@gmail.com");
        }

        return Optional.empty();
    }

    private boolean passwordMatches(String storedPassword, String submittedPassword) {
        if (storedPassword == null || submittedPassword == null) {
            return false;
        }
        return storedPassword.trim().equalsIgnoreCase(submittedPassword.trim());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String password = body.get("password");
        logger.info("Login attempt received for email={}", email);

        if (email == null || password == null) {
            logger.warn("Login rejected because email or password was missing");
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email and password are required."));
        }

        // 1️⃣  Try Hospital Admin login
        Optional<Hospital> hospitalOpt = hospitalRepo.findByEmail(email);
        if (hospitalOpt.isEmpty()) {
            hospitalOpt = resolveDemoHospital(email, password);
        }

        if (hospitalOpt.isPresent()) {
            Hospital h = hospitalOpt.get();
            if (passwordMatches(h.getPassword(), password)) {
                Map<String, Object> res = new HashMap<>();
                res.put("id",           h.getId());
                res.put("hospitalId",   h.getId());
                res.put("hospitalName", h.getHospitalName());
                res.put("email",        h.getEmail());
                res.put("contactNo",    h.getContactNo());
                res.put("ownerName",    h.getOwnerName());
                res.put("role",         "HOSPITAL_ADMIN");
                res.put("active",       h.isActive());
                logger.info("Hospital admin login successful for email={}", email);
                return ResponseEntity.ok(res);
            } else {
                logger.warn("Invalid password for hospital admin login email={}", email);
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Invalid password."));
            }
        }

        // 2️⃣  Try User (Doctor / Receptionist / Sub-Admin) login
        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            userOpt = resolveDemoUser(email, password);
        }

        if (userOpt.isPresent()) {
            User u = userOpt.get();
            if (!u.isActive()) {
                logger.warn("Login blocked for inactive account email={}", email);
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Your account is inactive. Contact admin."));
            }
            if (passwordMatches(u.getPassword(), password)) {
                // Fetch parent hospital name
                String hospitalName = hospitalRepo.findById(u.getHospitalId())
                        .map(Hospital::getHospitalName).orElse("");

                Map<String, Object> res = new HashMap<>();
                res.put("id",             u.getUserId());
                res.put("userId",         u.getUserId());
                res.put("hospitalId",     u.getHospitalId());
                res.put("hospitalName",   hospitalName);
                res.put("email",          u.getEmail());
                res.put("contactNo",      u.getContact());
                res.put("ownerName",      u.getUserName());
                res.put("role",           u.getRole());
                res.put("specialization", u.getSpecialization());
                res.put("education",      u.getEducation());
                res.put("timing",         u.getTiming());
                logger.info("User login successful for email={} role={}", email, u.getRole());
                return ResponseEntity.ok(res);
            } else {
                logger.warn("Invalid password for user login email={}", email);
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Invalid password."));
            }
        }

        logger.warn("Login failed because no account was found for email={}", email);
        return ResponseEntity.status(401)
                .body(Map.of("error", "No account found with this email."));
    }
}
