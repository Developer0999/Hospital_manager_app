package com.hospital.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity

@Table(name = "hospital")
public class Hospital {

    public Hospital() {
		super();
		// TODO Auto-generated constructor stub
	}
	public Hospital(Long id, String hospitalName, String gstNo, String panNo, String licenseNo, String address,
			String city, String state, String pincode, String branchName, String branchCode, String email,
			String contactNo, String alternateContact, String ownerName, String message, String website, String logo,
			String password, String role, boolean premium, LocalDate registrationDate, LocalDate premiumStartDate,
			LocalDate premiumExpireDate, boolean active, boolean deleted) {
		super();
		this.id = id;
		this.hospitalName = hospitalName;
		this.gstNo = gstNo;
		this.panNo = panNo;
		this.licenseNo = licenseNo;
		this.address = address;
		this.city = city;
		this.state = state;
		this.pincode = pincode;
		this.branchName = branchName;
		this.branchCode = branchCode;
		this.email = email;
		this.contactNo = contactNo;
		this.alternateContact = alternateContact;
		this.ownerName = ownerName;
		this.message = message;
		this.website = website;
		this.logo = logo;
		this.password = password;
		this.role = role;
		this.premium = premium;
		this.registrationDate = registrationDate;
		this.premiumStartDate = premiumStartDate;
		this.premiumExpireDate = premiumExpireDate;
		this.active = active;
		this.deleted = deleted;
	}
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getHospitalName() {
		return hospitalName;
	}
	public void setHospitalName(String hospitalName) {
		this.hospitalName = hospitalName;
	}
	public String getGstNo() {
		return gstNo;
	}
	public void setGstNo(String gstNo) {
		this.gstNo = gstNo;
	}
	public String getPanNo() {
		return panNo;
	}
	public void setPanNo(String panNo) {
		this.panNo = panNo;
	}
	public String getLicenseNo() {
		return licenseNo;
	}
	public void setLicenseNo(String licenseNo) {
		this.licenseNo = licenseNo;
	}
	public String getAddress() {
		return address;
	}
	public void setAddress(String address) {
		this.address = address;
	}
	public String getCity() {
		return city;
	}
	public void setCity(String city) {
		this.city = city;
	}
	public String getState() {
		return state;
	}
	public void setState(String state) {
		this.state = state;
	}
	public String getPincode() {
		return pincode;
	}
	public void setPincode(String pincode) {
		this.pincode = pincode;
	}
	public String getBranchName() {
		return branchName;
	}
	public void setBranchName(String branchName) {
		this.branchName = branchName;
	}
	public String getBranchCode() {
		return branchCode;
	}
	public void setBranchCode(String branchCode) {
		this.branchCode = branchCode;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getContactNo() {
		return contactNo;
	}
	public void setContactNo(String contactNo) {
		this.contactNo = contactNo;
	}
	public String getAlternateContact() {
		return alternateContact;
	}
	public void setAlternateContact(String alternateContact) {
		this.alternateContact = alternateContact;
	}
	public String getOwnerName() {
		return ownerName;
	}
	public void setOwnerName(String ownerName) {
		this.ownerName = ownerName;
	}
	public String getMessage() {
		return message;
	}
	public void setMessage(String message) {
		this.message = message;
	}
	public String getWebsite() {
		return website;
	}
	public void setWebsite(String website) {
		this.website = website;
	}
	public String getLogo() {
		return logo;
	}
	public void setLogo(String logo) {
		this.logo = logo;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public String getRole() {
		return role;
	}
	public void setRole(String role) {
		this.role = role;
	}
	public boolean isPremium() {
		return premium;
	}
	public void setPremium(boolean premium) {
		this.premium = premium;
	}
	public LocalDate getRegistrationDate() {
		return registrationDate;
	}
	public void setRegistrationDate(LocalDate registrationDate) {
		this.registrationDate = registrationDate;
	}
	public LocalDate getPremiumStartDate() {
		return premiumStartDate;
	}
	public void setPremiumStartDate(LocalDate premiumStartDate) {
		this.premiumStartDate = premiumStartDate;
	}
	public LocalDate getPremiumExpireDate() {
		return premiumExpireDate;
	}
	public void setPremiumExpireDate(LocalDate premiumExpireDate) {
		this.premiumExpireDate = premiumExpireDate;
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
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String hospitalName;
    private String gstNo;
    private String panNo;
    private String licenseNo;

    private String address;
    private String city;
    private String state;
    private String pincode;

    private String branchName;
    private String branchCode;

    @Column(unique = true)
    private String email;
    private String contactNo;
    private String alternateContact;

    private String ownerName;

    @Column(length = 1000)
    private String message;

    private String website;

    @Column(name = "logo", columnDefinition = "LONGTEXT")
    private String logo;

    private String password;

    private String role = "HOSPITAL_ADMIN";

    private boolean premium = false;

    private LocalDate registrationDate;
    private LocalDate premiumStartDate;
    private LocalDate premiumExpireDate;

    private boolean active = true;
    private boolean deleted = false;
}
