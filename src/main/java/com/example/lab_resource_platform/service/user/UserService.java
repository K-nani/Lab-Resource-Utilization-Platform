package com.example.lab_resource_platform.service.user;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.lab_resource_platform.dto.auth.RegisterRequest;
import com.example.lab_resource_platform.entity.Department;
import com.example.lab_resource_platform.entity.Institution;
import com.example.lab_resource_platform.entity.user.Role;
import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.repository.DepartmentRepo;
import com.example.lab_resource_platform.repository.InstitutionRepo;
import com.example.lab_resource_platform.repository.auth.UserRepo;
import com.example.lab_resource_platform.service.otp.OtpService;

import jakarta.validation.constraints.NotBlank;

@Service
public class UserService {

    @Autowired
    private UserRepo repo;

    @Autowired
    private OtpService otpService;

    @Autowired
    private  DepartmentRepo departmentRepo;

    @Autowired
    private  InstitutionRepo institutionRepo;


    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);




    @Transactional
    public User registerUser(RegisterRequest req) {
        if (repo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        if (repo.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        Institution institution = null;
        Department department = null;

        // SYSTEM_ADMIN is global — no institution/department required
        if (req.getRole() != Role.SYSTEM_ADMIN) {
            if (req.getInstitutionId() == null) {
                throw new IllegalArgumentException("Institution is required for role: " + req.getRole());
            }
            if (req.getDepartmentId() == null) {
                throw new IllegalArgumentException("Department is required for role: " + req.getRole());
            }

            institution = institutionRepo.findById(req.getInstitutionId())
                    .orElseThrow(() -> new RuntimeException("Institution not found: " + req.getInstitutionId()));

            department = departmentRepo.findById(req.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found: " + req.getDepartmentId()));

            if (!department.getInstitution().getId().equals(institution.getId())) {
                throw new IllegalArgumentException(
                        "Department '" + department.getName() +
                                "' does not belong to institution '" + institution.getName() + "'");
            }
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(encoder.encode(req.getPassword()));
        user.setRole(req.getRole());
        user.setEmailVerified(false);
        user.setDepartment(department);       // null for SYSTEM_ADMIN
        user.setInstitution(institution);     // null for SYSTEM_ADMIN

        User saved = repo.save(user);

        // Generate + send OTP (your existing logic)
        otpService.generateAndSendOtp(saved);


        return saved;
    }

    @Transactional
    public void changePassword(String email, String password){

        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(encoder.encode(password));
        repo.save(user);

    }


    public boolean verifyUserEmail(String email, String otp) {
        boolean isValid = otpService.verifyOtp(email, otp);

        if (isValid) {
            User user = repo.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setEmailVerified(true);
            repo.save(user);
        }

        return isValid;
    }

    public boolean userLogin(String username, String password){
        User user = repo.findByUsername(username);
        if(user == null){
            return false;
        }

        if(!user.getEmailVerified()){
            throw new RuntimeException("Email is not verified, please verify.");
        }

        // Verify password using BCrypt
        return encoder.matches(password, user.getPassword());

    }

    // Resend OTP
    public void resendOtp(String email) {
        // Find the user
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate and send new OTP
        otpService.generateAndSendOtp(user);
    }

    public void resetRequest(String email){
        Optional<User> userOpt = repo.findByEmail(email);
        if (userOpt.isEmpty()) {
            return;
        }
        User user = userOpt.get();
        otpService.generateAndSendResetOtp(user);
    }

    public boolean verifyResetOtp(String email, String otp){
        return otpService.verifyResetOtp(email, otp);
    }

    @Transactional(readOnly = true)
    public User findByUsername(String username) {
        User user = repo.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public User findByUserId(Long userId) {
        User user = repo.findById(userId).
                orElseThrow(() -> new RuntimeException("User Not found"));

        return user;
    }

    @Transactional(readOnly = true)
    public User findByEmail(@NotBlank(message = "User name required") String email) {
        User user = repo.findByEmail(email)
                .orElseThrow(()-> new RuntimeException("User Not Found"));
        return user;
    }
}
