package com.yigithas.falafal.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import com.yigithas.falafal.models.DogumGunu;
import com.yigithas.falafal.service.DogumService;

@RequestMapping(path = "/api/yorum")
@RestController
@CrossOrigin(origins = "*")
public class DogumContoller {

	@Autowired
	private DogumService dogumService;
	
	@GetMapping(path = "/list/{gun}/{ay}")
	public DogumGunu yorumGetir(@PathVariable(name = "gun") String gun,
			@PathVariable(name = "ay")String ay) {
		return dogumService.yorumGetir(gun, ay);
	}
	
	@PostMapping(path = "/post")
	public  DogumGunu saveDogumGunu(@RequestBody DogumGunu dogumGunu) {
		return dogumService.saveDogumGunu(dogumGunu);
	}
	
	@PostMapping(path = "/post-all")
	public List<DogumGunu> saveDogumGunleri(@RequestBody List<DogumGunu> liste){
		return dogumService.saveDogumGunleri(liste);
	}
	
}
