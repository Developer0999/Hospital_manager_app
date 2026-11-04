package com.hospital.controller;

import com.hospital.entity.Hospital;
import com.hospital.repository.HospitalRepository;
import com.hospital.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    @Mock
    private HospitalRepository hospitalRepo;

    @Mock
    private UserRepository userRepo;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void loginWithDemoAdminCredentialsShouldSucceed() {
        Hospital hospital = new Hospital();
        hospital.setId(1L);
        hospital.setHospitalName("Demo Hospital");
        hospital.setEmail("Anandi@gmail.com");
        hospital.setPassword("Admin123");
        hospital.setContactNo("1234567890");
        hospital.setOwnerName("Demo Owner");
        hospital.setActive(true);

        when(hospitalRepo.findByEmail("admin@hospital.com")).thenReturn(Optional.empty());
        when(hospitalRepo.findByEmail("Anandi@gmail.com")).thenReturn(Optional.of(hospital));
        when(userRepo.findByEmail("admin@hospital.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = authController.login(Map.of("email", "admin@hospital.com", "password", "admin123"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Demo Hospital", ((Map<?, ?>) response.getBody()).get("hospitalName"));
    }
}
