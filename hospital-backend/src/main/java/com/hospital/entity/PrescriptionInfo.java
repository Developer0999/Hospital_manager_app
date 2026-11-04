package com.hospital.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "prescription_info")
public class PrescriptionInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long prescriptionId;

    private Long doctorId;
    private Long hospitalId;

    private String hospitalName;
    private String hospitalAddress;
    private String hospitalPhone;
    private String hospitalEmail;
    private String location;
    private String regNo;
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String defaultInstructions;

    @Column(columnDefinition = "TEXT")
    private String defaultFooter;

    @Column(columnDefinition = "TEXT")
    private String instructionsJson;

    @Column(columnDefinition = "TEXT")
    private String footerJson;

    private LocalDate updatedDate;

    public PrescriptionInfo() {
    }

    public Long getPrescriptionId() {
        return prescriptionId;
    }

    public void setPrescriptionId(Long prescriptionId) {
        this.prescriptionId = prescriptionId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public Long getHospitalId() {
        return hospitalId;
    }

    public void setHospitalId(Long hospitalId) {
        this.hospitalId = hospitalId;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public void setHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

    public String getHospitalAddress() {
        return hospitalAddress;
    }

    public void setHospitalAddress(String hospitalAddress) {
        this.hospitalAddress = hospitalAddress;
    }

    public String getHospitalPhone() {
        return hospitalPhone;
    }

    public void setHospitalPhone(String hospitalPhone) {
        this.hospitalPhone = hospitalPhone;
    }

    public String getHospitalEmail() {
        return hospitalEmail;
    }

    public void setHospitalEmail(String hospitalEmail) {
        this.hospitalEmail = hospitalEmail;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getRegNo() {
        return regNo;
    }

    public void setRegNo(String regNo) {
        this.regNo = regNo;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getDefaultInstructions() {
        return defaultInstructions;
    }

    public void setDefaultInstructions(String defaultInstructions) {
        this.defaultInstructions = defaultInstructions;
    }

    public String getDefaultFooter() {
        return defaultFooter;
    }

    public void setDefaultFooter(String defaultFooter) {
        this.defaultFooter = defaultFooter;
    }

    public String getInstructionsJson() {
        return instructionsJson;
    }

    public void setInstructionsJson(String instructionsJson) {
        this.instructionsJson = instructionsJson;
    }

    public String getFooterJson() {
        return footerJson;
    }

    public void setFooterJson(String footerJson) {
        this.footerJson = footerJson;
    }

    public LocalDate getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(LocalDate updatedDate) {
        this.updatedDate = updatedDate;
    }
}
