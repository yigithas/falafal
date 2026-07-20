package com.yigithas.falafal.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table( name = "dogum_gunu")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DogumGunu {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column(name = "gun")
	private String gun;
	
	@Column(name = "ay")
	private String ay;
	
	
	@Column(columnDefinition = "TEXT")
	private String yorum;
}
