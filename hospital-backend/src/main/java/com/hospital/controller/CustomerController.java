package com.hospital.controller;

import com.hospital.entity.Customer;
import com.hospital.repository.CustomerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);

    @Autowired
    private CustomerRepository repo;

    @GetMapping
    public List<Customer> getAll() {
        logger.info("Fetching all customers");
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getById(@PathVariable Long id) {
        logger.info("Fetching customer with id={}", id);
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/hospital/{hospitalId}")
    public List<Customer> getByHospital(@PathVariable Long hospitalId) {
        return repo.findByHospitalId(hospitalId);
    }

    @PostMapping
    public Customer save(@RequestBody Customer c) {
        logger.info("Creating customer for hospitalId={}", c.getHospitalId());
        if (c.getRegisteredDate() == null) {
            c.setRegisteredDate(LocalDate.now());
        }
        return repo.save(c);
    }

    @PutMapping("/{id}")
    public Customer update(@PathVariable Long id, @RequestBody Customer c) {
        logger.info("Updating customer id={}", id);
        c.setCustId(id);
        return repo.save(c);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        logger.info("Deleting customer id={}", id);
        repo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
