package com.yigithas.falafal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;


@EnableJpaRepositories(basePackages = "com.yigithas")
@EntityScan(basePackages = "com.yigithas")
@ComponentScan(basePackages = "com.yigithas")
@SpringBootApplication
public class FalafalApplication {

	public static void main(String[] args) {
		SpringApplication.run(FalafalApplication.class, args);
	}

}
