package com.example.lab_resource_platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@EnableAsync
public class LabResourcePlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(LabResourcePlatformApplication.class, args);
	}

}
