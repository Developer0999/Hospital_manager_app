package com.hospital.repository;

import com.hospital.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByHospitalId(Long hospitalId);
}
