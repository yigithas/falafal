package com.yigithas.falafal.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.yigithas.falafal.models.DogumGunu;
import com.yigithas.falafal.repository.DogumRepository;

@Service
public class DogumService {

	@Autowired
	private DogumRepository dogumRepository;
	
	public DogumGunu yorumGetir(String gun,String ay) {
		
		
	Optional<DogumGunu> optional = dogumRepository.findByGunAndAy(gun, ay);
		
		if(optional.isEmpty()) {
			return null;
		}

		return optional.get();
		
	}
	
	public DogumGunu saveDogumGunu(DogumGunu dogumGunu) {
		return dogumRepository.save(dogumGunu);
		
	}
	
	public List<DogumGunu> saveDogumGunleri(List<DogumGunu> liste){
		return dogumRepository.saveAll(liste);
	}
	
	
}
