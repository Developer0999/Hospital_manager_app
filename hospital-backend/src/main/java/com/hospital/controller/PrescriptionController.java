package com.hospital.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.entity.Prescription;
import com.hospital.service.PrescriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/prescription")
@CrossOrigin(origins = "*")
public class PrescriptionController {

    @Autowired
    private PrescriptionService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping
    public ResponseEntity<Prescription> save(@RequestBody Prescription p) {
        return ResponseEntity.ok(service.save(p));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Prescription> update(@PathVariable Long id,
                                               @RequestBody Prescription p) {
        return ResponseEntity.ok(service.update(id, p));
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<Map<String, Object>> uploadReport(@PathVariable Long id,
                                                            @RequestParam(value = "files", required = false) List<MultipartFile> files,
                                                            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        Prescription prescription = service.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found: " + id));

        List<MultipartFile> uploads = new ArrayList<>();
        if (files != null) uploads.addAll(files);
        if (file != null) uploads.add(file);
        uploads.removeIf(MultipartFile::isEmpty);
        if (uploads.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No report files uploaded"));
        }

        Path uploadDir = Paths.get("uploads", "prescription-reports").toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);

        List<Map<String, String>> reportFiles = readReportFiles(prescription);
        for (MultipartFile upload : uploads) {
            String originalFilename = Optional.ofNullable(upload.getOriginalFilename()).orElse("report");
            String safeName = originalFilename.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
            String storedName = "prescription-" + id + "-" + System.currentTimeMillis() + "-" + safeName;
            Path target = uploadDir.resolve(storedName).normalize();
            if (!target.startsWith(uploadDir)) {
                throw new IOException("Invalid report file path");
            }
            Files.copy(upload.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            reportFiles.add(new LinkedHashMap<>(Map.of(
                    "name", originalFilename,
                    "storedName", storedName,
                    "url", "/api/prescription/" + id + "/report/download/" + storedName
            )));
        }

        Map<String, String> latest = reportFiles.get(reportFiles.size() - 1);
        prescription.setReportName(latest.get("name"));
        prescription.setReportUrl(latest.get("url"));
        prescription.setReportFilesJson(objectMapper.writeValueAsString(reportFiles));
        service.save(prescription);

        return ResponseEntity.ok(Map.of(
                "reportUrl", prescription.getReportUrl(),
                "reportName", prescription.getReportName(),
                "reportFiles", reportFiles
        ));
    }

    @GetMapping("/{id}/report/download")
    public ResponseEntity<Resource> downloadReport(@PathVariable Long id) throws MalformedURLException {
        Prescription prescription = service.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found: " + id));
        if (prescription.getReportUrl() == null && prescription.getReportFilesJson() == null) {
            return ResponseEntity.notFound().build();
        }

        Path uploadDir = Paths.get("uploads", "prescription-reports").toAbsolutePath().normalize();
        try {
            String storedName = readReportFiles(prescription).stream()
                    .reduce((first, second) -> second)
                    .map(r -> r.get("storedName"))
                    .orElse(null);
            Path filePath = storedName != null && !storedName.isBlank()
                    ? uploadDir.resolve(storedName).normalize()
                    : Files.list(uploadDir)
                    .filter(p -> p.getFileName().toString().startsWith("prescription-" + id + "-"))
                    .findFirst()
                    .orElseThrow();
            if (!filePath.startsWith(uploadDir)) return ResponseEntity.notFound().build();
            Resource resource = new UrlResource(filePath.toUri());
            String filename = prescription.getReportName() != null ? prescription.getReportName() : resource.getFilename();
            return reportResponse(resource, filename);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/report/download/{storedName:.+}")
    public ResponseEntity<Resource> downloadReportFile(@PathVariable Long id,
                                                       @PathVariable String storedName) throws MalformedURLException {
        Prescription prescription = service.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found: " + id));
        Map<String, String> report = readReportFiles(prescription).stream()
                .filter(r -> storedName.equals(r.get("storedName")))
                .findFirst()
                .orElse(null);
        if (report == null) return ResponseEntity.notFound().build();

        Path uploadDir = Paths.get("uploads", "prescription-reports").toAbsolutePath().normalize();
        Path filePath = uploadDir.resolve(storedName).normalize();
        if (!filePath.startsWith(uploadDir) || !Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(filePath.toUri());
        String filename = report.getOrDefault("name", resource.getFilename());
        return reportResponse(resource, filename);
    }

    private ResponseEntity<Resource> reportResponse(Resource resource, String filename) {
        String downloadName = Optional.ofNullable(filename)
                .filter(name -> !name.isBlank())
                .orElse("report");
        String extension = Optional.of(downloadName)
                .filter(name -> name.contains("."))
                .map(name -> name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT))
                .orElse("");
        MediaType contentType;
        boolean inline;
        switch (extension) {
            case "pdf":
                contentType = MediaType.APPLICATION_PDF;
                inline = true;
                break;
            case "jpg":
            case "jpeg":
                contentType = MediaType.IMAGE_JPEG;
                inline = true;
                break;
            case "png":
                contentType = MediaType.IMAGE_PNG;
                inline = true;
                break;
            case "gif":
                contentType = MediaType.IMAGE_GIF;
                inline = true;
                break;
            case "webp":
                contentType = MediaType.parseMediaType("image/webp");
                inline = true;
                break;
            default:
                contentType = MediaType.APPLICATION_OCTET_STREAM;
                inline = false;
        }

        ContentDisposition disposition = inline
                ? ContentDisposition.inline().filename(downloadName, StandardCharsets.UTF_8).build()
                : ContentDisposition.attachment().filename(downloadName, StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(resource);
    }

    private List<Map<String, String>> readReportFiles(Prescription prescription) {
        try {
            String raw = prescription.getReportFilesJson();
            if (raw != null && !raw.isBlank()) {
                return objectMapper.readValue(raw, new TypeReference<List<Map<String, String>>>() {});
            }
        } catch (Exception ignored) {
        }

        List<Map<String, String>> fallback = new ArrayList<>();
        if (prescription.getReportUrl() != null && prescription.getReportName() != null) {
            fallback.add(new LinkedHashMap<>(Map.of(
                    "name", prescription.getReportName(),
                    "storedName", "",
                    "url", prescription.getReportUrl()
            )));
        }
        return fallback;
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<List<Prescription>> byHospital(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(service.findByHospital(hospitalId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Prescription>> byDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(service.findByDoctor(doctorId));
    }

    // Patient history
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Prescription>> byCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(service.findByCustomer(customerId));
    }

    @GetMapping("/hospital/{hospitalId}/customer/{customerId}")
    public ResponseEntity<List<Prescription>> byHospitalAndCustomer(
            @PathVariable Long hospitalId, @PathVariable Long customerId) {
        return ResponseEntity.ok(service.findByHospitalAndCustomer(hospitalId, customerId));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<Prescription>> byAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(service.findByAppointment(appointmentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Prescription> findById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Prescription cancelled");
    }

    @GetMapping("/hospital/{hospitalId}/count")
    public ResponseEntity<Map<String, Long>> count(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(Map.of("count", service.countByHospital(hospitalId)));
    }
}
