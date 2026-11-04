package com.hospital.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity

@Table(name = "appointment")
public class AppointmentHistory {

    public AppointmentHistory() {
		super();
		// TODO Auto-generated constructor stub
	}

	public AppointmentHistory(Long appointmentId, Long hospitalId, Long doctorId, Long customerId, String patientName,
			String doctorName, String department, String appointmentDate, String timeSlot, String reason, String status,
			Double fees) {
		super();
		this.appointmentId = appointmentId;
		this.hospitalId = hospitalId;
		this.doctorId = doctorId;
		this.customerId = customerId;
		this.patientName = patientName;
		this.doctorName = doctorName;
		this.department = department;
		this.appointmentDate = appointmentDate;
		this.timeSlot = timeSlot;
		this.reason = reason;
		this.status = status;
		this.fees = fees;
	}

	public Long getAppointmentId() {
		return appointmentId;
	}

	public void setAppointmentId(Long appointmentId) {
		this.appointmentId = appointmentId;
	}

	public Long getHospitalId() {
		return hospitalId;
	}

	public void setHospitalId(Long hospitalId) {
		this.hospitalId = hospitalId;
	}

	public Long getDoctorId() {
		return doctorId;
	}

	public void setDoctorId(Long doctorId) {
		this.doctorId = doctorId;
	}

	public Long getCustomerId() {
		return customerId;
	}

	public void setCustomerId(Long customerId) {
		this.customerId = customerId;
	}

	public String getPatientName() {
		return patientName;
	}

	public void setPatientName(String patientName) {
		this.patientName = patientName;
	}

	public String getDoctorName() {
		return doctorName;
	}

	public void setDoctorName(String doctorName) {
		this.doctorName = doctorName;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public String getAppointmentDate() {
		return appointmentDate;
	}

	public void setAppointmentDate(String appointmentDate) {
		this.appointmentDate = appointmentDate;
	}

	public String getTimeSlot() {
		return timeSlot;
	}

	public void setTimeSlot(String timeSlot) {
		this.timeSlot = timeSlot;
	}

	public String getSessionNumber() {
		return sessionNumber;
	}

	public void setSessionNumber(String sessionNumber) {
		this.sessionNumber = sessionNumber;
	}

	public String getVisitType() {
		return visitType;
	}

	public void setVisitType(String visitType) {
		this.visitType = visitType;
	}

	public String getReason() {
		return reason;
	}

	public void setReason(String reason) {
		this.reason = reason;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Double getFees() {
		return fees;
	}

	public void setFees(Double fees) {
		this.fees = fees;
	}

	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long appointmentId;

    private Long hospitalId;
    private Long doctorId;
    private Long customerId;

    private String patientName;
    private String doctorName;
    private String department;

    private String appointmentDate;   // stored as String "yyyy-MM-dd" for easy filtering
    private String timeSlot;
    private String sessionNumber;
    private String visitType;

    @Column(length = 1000)
    private String reason;

    // Pending / Confirmed / Completed / Cancelled
    private String status = "Pending";

    private Double fees;
}
