package com.example.lab_resource_platform.controller;

import com.example.lab_resource_platform.dto.*;
import com.example.lab_resource_platform.entity.BookingAudit;
import com.example.lab_resource_platform.entity.Bookings.Booking;
import com.example.lab_resource_platform.entity.Waitlist;
import com.example.lab_resource_platform.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        Long equipmentId = Long.valueOf(body.get("equipmentId").toString());
        LocalDateTime start = LocalDateTime.parse(body.get("startTime").toString());
        LocalDateTime end = LocalDateTime.parse(body.get("endTime").toString());
        Booking b = bookingService.createBooking(userId, equipmentId, start, end);

        if (b == null) {
            // Waitlist case — the waitlist entry was saved successfully
            return ResponseEntity.ok("Slot conflicting with an active timeline. Auto-added to the Waitlist.");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(BookingResponse.from(b));
    }

    @PostMapping("/create-recurring")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<RecurringBookingResponse> createRecurring(@Valid @RequestBody RecurringBookingRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createRecurring(req));
    }

    @GetMapping("/calendar")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<List<BookingResponse>> calendar(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(bookingService.findUserCalendar(userId, start, end)
                .stream().map(BookingResponse::from).toList());
    }

    @GetMapping("/equipment-calendar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> equipmentCalendar(
            @RequestParam Long equipmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(bookingService.findEquipmentCalendar(equipmentId, start, end)
                .stream().map(BookingResponse::from).toList());
    }

    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('LAB_MANAGER')")
    public ResponseEntity<?> accept(@PathVariable Long id) {
        var booking = bookingService.accept(id);
        if (booking == null) {
            // Booking was conflicting - moved to waitlist
            return ResponseEntity.ok(java.util.Map.of(
                "message", "This booking conflicts with an existing confirmed booking and has been moved to the waitlist.",
                "movedToWaitlist", true
            ));
        }
        return ResponseEntity.ok(BookingResponse.from(booking));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('LAB_MANAGER')")
    public ResponseEntity<BookingResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(BookingResponse.from(bookingService.reject(id)));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('RESEARCHER','LAB_MANAGER')")
    public ResponseEntity<BookingResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(BookingResponse.from(bookingService.cancel(id)));
    }

    @PutMapping("/{id}/start")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<BookingResponse> start(@PathVariable Long id) {
        return ResponseEntity.ok(BookingResponse.from(bookingService.start(id)));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('RESEARCHER','LAB_MANAGER')")
    public ResponseEntity<BookingResponse> complete(@PathVariable Long id) {
        return ResponseEntity.ok(BookingResponse.from(bookingService.complete(id)));
    }

    @PutMapping("/{id}/no-show")
    @PreAuthorize("hasRole('LAB_MANAGER')")
    public ResponseEntity<BookingResponse> noShow(@PathVariable Long id) {
        return ResponseEntity.ok(BookingResponse.from(bookingService.noShow(id)));
    }

    @GetMapping("/{id}/audit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingAuditResponse>> bookingAudit(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.findBookingAudit(id)
                .stream().map(BookingAuditResponse::from).toList());
    }

    @GetMapping("/equipment-audit/{equipmentId}")
    @PreAuthorize("hasRole('LAB_MANAGER')")
    public ResponseEntity<List<BookingAuditResponse>> equipmentAudit(@PathVariable Long equipmentId) {
        return ResponseEntity.ok(bookingService.findEquipmentAudit(equipmentId)
                .stream().map(BookingAuditResponse::from).toList());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','INSTITUTION_ADMIN')")
    public ResponseEntity<List<BookingResponse>> all() {
        return ResponseEntity.ok(bookingService.findAllForCurrentManagerDepartment()
                .stream().map(BookingResponse::from).toList());
    }

    @GetMapping("/my-dashboard/{userId}")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<ResearcherDashboardDto> myDashboard(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingService.getResearcherDashboard(userId));
    }

    @GetMapping("/{id}/can-manage")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','INSTITUTION_ADMIN')")
    public ResponseEntity<Map<String, Boolean>> canManage(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("canManage", bookingService.canCurrentUserManageBooking(id)));
    }
}