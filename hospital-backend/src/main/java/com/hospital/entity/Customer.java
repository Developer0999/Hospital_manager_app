package com.hospital.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity

@Table(name = "customer")
public class Customer {

    public Customer() {
		super();
		// TODO Auto-generated constructor stub
	}
	public Customer(Long custId, Long hospitalId, String custName, String custContact, String custEmail,
			String custAddress, String custMessage, Integer age, String gender, String disease,
			LocalDate registeredDate, boolean active) {
		super();
		this.custId = custId;
		this.hospitalId = hospitalId;
		this.custName = custName;
		this.custContact = custContact;
		this.custEmail = custEmail;
		this.custAddress = custAddress;
		this.custMessage = custMessage;
		this.age = age;
		this.gender = gender;
		this.disease = disease;
		this.registeredDate = registeredDate;
		this.active = active;
	}
	public Long getCustId() {
		return custId;
	}
	public void setCustId(Long custId) {
		this.custId = custId;
	}
	public Long getHospitalId() {
		return hospitalId;
	}
	public void setHospitalId(Long hospitalId) {
		this.hospitalId = hospitalId;
	}
	public String getCustName() {
		return custName;
	}
	public void setCustName(String custName) {
		this.custName = custName;
	}
	public String getCustContact() {
		return custContact;
	}
	public void setCustContact(String custContact) {
		this.custContact = custContact;
	}
	public String getCustEmail() {
		return custEmail;
	}
	public void setCustEmail(String custEmail) {
		this.custEmail = custEmail;
	}
	public String getCustAddress() {
		return custAddress;
	}
	public void setCustAddress(String custAddress) {
		this.custAddress = custAddress;
	}
	public String getCustMessage() {
		return custMessage;
	}
	public void setCustMessage(String custMessage) {
		this.custMessage = custMessage;
	}
	public Integer getAge() {
		return age;
	}
	public void setAge(Integer age) {
		this.age = age;
	}
	public String getGender() {
		return gender;
	}
	public void setGender(String gender) {
		this.gender = gender;
	}
	public String getDisease() {
		return disease;
	}
	public void setDisease(String disease) {
		this.disease = disease;
	}
	public LocalDate getRegisteredDate() {
		return registeredDate;
	}
	public void setRegisteredDate(LocalDate registeredDate) {
		this.registeredDate = registeredDate;
	}
	public boolean isActive() {
		return active;
	}
	public void setActive(boolean active) {
		this.active = active;
	}
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long custId;

    private Long hospitalId;

    private String custName;
    private String custContact;

    private String custEmail;

    private String custAddress;

    @Column(length = 1000)
    private String custMessage;

    private Integer age;
    private String gender;
    private String disease;

    private LocalDate registeredDate;
    private boolean active = true;
}
