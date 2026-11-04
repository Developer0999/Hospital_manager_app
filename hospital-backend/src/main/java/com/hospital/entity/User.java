package com.hospital.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity

@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;


	private Long hospitalId;

    private String userName;
    private String userCode;

    @Column(unique = true)
    private String email;
    private String password;

    private String address;

    // DOCTOR / RECEPTIONIST / ADMIN
    private String role;

    private String contact;
    private String contact2;

    // Doctor-specific fields
    private String specialization;
    private String education;
    private String location;
    private String timing;
    private Double fees;
    private String licenseNo;

    private boolean active = true;
    private boolean deleted = false;

    private LocalDate createdDate;

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public Long getHospitalId() {
		return hospitalId;
	}

	public void setHospitalId(Long hospitalId) {
		this.hospitalId = hospitalId;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getUserCode() {
		return userCode;
	}

	public void setUserCode(String userCode) {
		this.userCode = userCode;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getContact() {
		return contact;
	}

	public void setContact(String contact) {
		this.contact = contact;
	}

	public String getContact2() {
		return contact2;
	}

	public void setContact2(String contact2) {
		this.contact2 = contact2;
	}

	public String getSpecialization() {
		return specialization;
	}

	public void setSpecialization(String specialization) {
		this.specialization = specialization;
	}

	public String getEducation() {
		return education;
	}

	public void setEducation(String education) {
		this.education = education;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public String getTiming() {
		return timing;
	}

	public void setTiming(String timing) {
		this.timing = timing;
	}

	public Double getFees() {
		return fees;
	}

	public void setFees(Double fees) {
		this.fees = fees;
	}

	public String getLicenseNo() {
		return licenseNo;
	}

	public void setLicenseNo(String licenseNo) {
		this.licenseNo = licenseNo;
	}

	public boolean isActive() {
		return active;
	}

	public void setActive(boolean active) {
		this.active = active;
	}

	public boolean isDeleted() {
		return deleted;
	}

	public void setDeleted(boolean deleted) {
		this.deleted = deleted;
	}

	public LocalDate getCreatedDate() {
		return createdDate;
	}

	public void setCreatedDate(LocalDate createdDate) {
		this.createdDate = createdDate;
	}

    public User() {
		super();
		// TODO Auto-generated constructor stub
	}

	public User(Long userId, Long hospitalId, String userName, String userCode, String email, String password,
			String address, String role, String contact, String contact2, String specialization, String education,
			String location, String timing, Double fees, String licenseNo, boolean active, boolean deleted,
			LocalDate createdDate) {
		super();
		this.userId = userId;
		this.hospitalId = hospitalId;
		this.userName = userName;
		this.userCode = userCode;
		this.email = email;
		this.password = password;
		this.address = address;
		this.role = role;
		this.contact = contact;
		this.contact2 = contact2;
		this.specialization = specialization;
		this.education = education;
		this.location = location;
		this.timing = timing;
		this.fees = fees;
		this.licenseNo = licenseNo;
		this.active = active;
		this.deleted = deleted;
		this.createdDate = createdDate;
	}
}
