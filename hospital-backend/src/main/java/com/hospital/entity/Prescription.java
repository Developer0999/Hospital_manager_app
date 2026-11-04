package com.hospital.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long prescriptionId;

    private Long hospitalId;
    private Long doctorId;
    private Long customerId;
    private Long appointmentId;

    private String patientName;
    private Integer patientAge;
    private String patientGender;
    private String patientContact;
    private String patientAddress;
    private String bloodGroup;

    private String doctorName;
    private String doctorQualification;
    private String doctorSpecialization;
    private String doctorContact;

    private String hospitalName;
    private String hospitalAddress;
    private String hospitalContact;
    private String hospitalEmail;
    private String hospitalLogo;

    private String bloodPressure;
    private String weight;
    private String temperature;
    private String pulseRate;
    private String oxygenLevel;

    @Column(columnDefinition = "TEXT")
    private String complaints;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(columnDefinition = "TEXT")
    private String medicalInstructions;

    @Column(columnDefinition = "TEXT")
    private String patientNotes;
    private String reportUrl;
    private String reportName;

    @Column(columnDefinition = "TEXT")
    private String reportFilesJson;

    private String followUpDate;
    private String templateType;

    @Column(columnDefinition = "TEXT")
    private String medicinesJson;

    private String status = "Active";
    private LocalDate prescriptionDate;
    private LocalDate registrationDate;

    public Prescription() {}

    public Long getPrescriptionId()              { return prescriptionId; }
    public void setPrescriptionId(Long v)        { this.prescriptionId = v; }
    public Long getHospitalId()                  { return hospitalId; }
    public void setHospitalId(Long v)            { this.hospitalId = v; }
    public Long getDoctorId()                    { return doctorId; }
    public void setDoctorId(Long v)              { this.doctorId = v; }
    public Long getCustomerId()                  { return customerId; }
    public void setCustomerId(Long v)            { this.customerId = v; }
    public Long getAppointmentId()               { return appointmentId; }
    public void setAppointmentId(Long v)         { this.appointmentId = v; }
    public String getPatientName()               { return patientName; }
    public void setPatientName(String v)         { this.patientName = v; }
    public Integer getPatientAge()               { return patientAge; }
    public void setPatientAge(Integer v)         { this.patientAge = v; }
    public String getPatientGender()             { return patientGender; }
    public void setPatientGender(String v)       { this.patientGender = v; }
    public String getPatientContact()            { return patientContact; }
    public void setPatientContact(String v)      { this.patientContact = v; }
    public String getPatientAddress()            { return patientAddress; }
    public void setPatientAddress(String v)      { this.patientAddress = v; }
    public String getBloodGroup()                { return bloodGroup; }
    public void setBloodGroup(String v)          { this.bloodGroup = v; }
    public String getDoctorName()                { return doctorName; }
    public void setDoctorName(String v)          { this.doctorName = v; }
    public String getDoctorQualification()       { return doctorQualification; }
    public void setDoctorQualification(String v) { this.doctorQualification = v; }
    public String getDoctorSpecialization()      { return doctorSpecialization; }
    public void setDoctorSpecialization(String v){ this.doctorSpecialization = v; }
    public String getDoctorContact()             { return doctorContact; }
    public void setDoctorContact(String v)       { this.doctorContact = v; }
    public String getHospitalName()              { return hospitalName; }
    public void setHospitalName(String v)        { this.hospitalName = v; }
    public String getHospitalAddress()           { return hospitalAddress; }
    public void setHospitalAddress(String v)     { this.hospitalAddress = v; }
    public String getHospitalContact()           { return hospitalContact; }
    public void setHospitalContact(String v)     { this.hospitalContact = v; }
    public String getHospitalEmail()             { return hospitalEmail; }
    public void setHospitalEmail(String v)       { this.hospitalEmail = v; }
    public String getHospitalLogo()              { return hospitalLogo; }
    public void setHospitalLogo(String v)        { this.hospitalLogo = v; }
    public String getBloodPressure()             { return bloodPressure; }
    public void setBloodPressure(String v)       { this.bloodPressure = v; }
    public String getWeight()                    { return weight; }
    public void setWeight(String v)              { this.weight = v; }
    public String getTemperature()               { return temperature; }
    public void setTemperature(String v)         { this.temperature = v; }
    public String getPulseRate()                 { return pulseRate; }
    public void setPulseRate(String v)           { this.pulseRate = v; }
    public String getOxygenLevel()               { return oxygenLevel; }
    public void setOxygenLevel(String v)         { this.oxygenLevel = v; }
    public String getComplaints()                { return complaints; }
    public void setComplaints(String v)          { this.complaints = v; }
    public String getDiagnosis()                 { return diagnosis; }
    public void setDiagnosis(String v)           { this.diagnosis = v; }
    public String getInstructions()              { return instructions; }
    public void setInstructions(String v)        { this.instructions = v; }
    public String getMedicalInstructions()       { return medicalInstructions; }
    public void setMedicalInstructions(String v) { this.medicalInstructions = v; }
    public String getPatientNotes()               { return patientNotes; }
    public void setPatientNotes(String v)          { this.patientNotes = v; }
    public String getReportUrl()                  { return reportUrl; }
    public void setReportUrl(String v)            { this.reportUrl = v; }
    public String getReportName()                 { return reportName; }
    public void setReportName(String v)           { this.reportName = v; }
    public String getReportFilesJson()             { return reportFilesJson; }
    public void setReportFilesJson(String v)       { this.reportFilesJson = v; }
    public String getFollowUpDate()              { return followUpDate; }
    public void setFollowUpDate(String v)        { this.followUpDate = v; }
    public String getTemplateType()              { return templateType; }
    public void setTemplateType(String v)        { this.templateType = v; }
    public String getMedicinesJson()             { return medicinesJson; }
    public void setMedicinesJson(String v)       { this.medicinesJson = v; }
    public String getStatus()                    { return status; }
    public void setStatus(String v)              { this.status = v; }
    public LocalDate getPrescriptionDate()       { return prescriptionDate; }
    public void setPrescriptionDate(LocalDate v) { this.prescriptionDate = v; }
    public LocalDate getRegistrationDate()       { return registrationDate; }
    public void setRegistrationDate(LocalDate v) { this.registrationDate = v; }
}
