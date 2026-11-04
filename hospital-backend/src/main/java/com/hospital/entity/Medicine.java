package com.hospital.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "medicines")
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long medicineId;

    private Long hospitalId;

    private String medicineName;       // e.g. Paracetamol 500mg
    private String genericName;        // e.g. Paracetamol
    private String category;           // Antibiotic / Analgesic / Vitamin / Syrup
    private String type;               // Tablet / Capsule / Syrup / Injection / Drop / Cream
    private String manufacturer;
    private String composition;
    private Double price;
    private String unit;               // mg / ml / mcg
    private Boolean active = true;

    public Medicine() {}

    public Long getMedicineId()                      { return medicineId; }
    public void setMedicineId(Long v)                { this.medicineId = v; }
    public Long getHospitalId()                      { return hospitalId; }
    public void setHospitalId(Long v)                { this.hospitalId = v; }
    public String getMedicineName()                  { return medicineName; }
    public void setMedicineName(String v)            { this.medicineName = v; }
    public String getGenericName()                   { return genericName; }
    public void setGenericName(String v)             { this.genericName = v; }
    public String getCategory()                      { return category; }
    public void setCategory(String v)                { this.category = v; }
    public String getType()                          { return type; }
    public void setType(String v)                    { this.type = v; }
    public String getManufacturer()                  { return manufacturer; }
    public void setManufacturer(String v)            { this.manufacturer = v; }
    public String getComposition()                   { return composition; }
    public void setComposition(String v)             { this.composition = v; }
    public Double getPrice()                         { return price; }
    public void setPrice(Double v)                   { this.price = v; }
    public String getUnit()                          { return unit; }
    public void setUnit(String v)                    { this.unit = v; }
    public Boolean getActive()                       { return active; }
    public void setActive(Boolean v)                 { this.active = v; }
}
