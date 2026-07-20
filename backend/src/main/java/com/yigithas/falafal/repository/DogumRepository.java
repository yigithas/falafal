package com.yigithas.falafal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.yigithas.falafal.models.DogumGunu;
import java.util.List;
import java.util.Optional;


@Repository
public interface DogumRepository extends JpaRepository<DogumGunu, Long>{

	Optional<DogumGunu> findByGunAndAy(String gun, String ay);	
}
