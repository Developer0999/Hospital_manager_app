package com.hospital.repository;

import com.hospital.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
     Optional<User> findByContact(String contact);
    List<User> findByHospitalIdAndDeletedFalse(Long hospitalId);
    List<User> findByHospitalIdAndRoleAndDeletedFalse(Long hospitalId, String role);
}
