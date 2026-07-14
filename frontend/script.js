const falFormu = document.getElementById('myForm');
const falResmi = document.getElementById('falResmi');
const ana_div = document.getElementById('ana_div'); 
const durumMesaji = document.getElementById('durumMesaji'); 

let yapayZekaModeli = null;

// Cihazın iPhone / iOS olup olmadığını kontrol 
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && ('ontouchstart' in window);

async function modeliYukle() {
    if (isIOS) {
        if(durumMesaji) durumMesaji.innerText = "Sistem hazır! Bilgilerini girip falına bakabilirsin.";
        return;
    }

    try {
        if(durumMesaji) durumMesaji.innerText = "Yapay zeka modeli yükleniyor, lütfen bekleyin...";
        await tf.ready(); 
        yapayZekaModeli = await mobilenet.load();
        if(durumMesaji) durumMesaji.innerText = "Model hazır! Bilgilerini girip falına bakabilirsin.";
    } catch (hata) {
        console.error("Model yüklenemedi:", hata);
        if(durumMesaji) durumMesaji.innerText = "Sistem hazır! Bilgilerini girip falına bakabilirsin.";
    }
}
modeliYukle();


falResmi.addEventListener('change', function(event) {
    const dosya = event.target.files[0];
    const secildiDurumu = document.querySelector('.secildi-durumu');
    if (dosya && secildiDurumu) {
        secildiDurumu.style.display = "inline-block"; //
    }
});

falFormu.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ─── MODEL HAZIRLIK KONTROLÜ ───
    if (!isIOS && !yapayZekaModeli) {
        alert("Yapay zeka modeli henüz yükleniyor, lütfen birkaç saniye sonra tekrar deneyin.");
        return;
    }

    if (falResmi.files.length === 0) {
        alert("Lütfen bir kahve fincanı fotoğrafı yükleyin!");
        return;
    }

    if(durumMesaji) durumMesaji.innerText = "Fincanınız inceleniyor...";

    let fincanBulunduMu = false;
    const dosya = falResmi.files[0];

    // ─── 1. ADIM: TENSORFLOW ANALİZİ (GÜVENLİK KAPISI) ───
    if (!isIOS && yapayZekaModeli && dosya) {
        try {
            
            
            // 🧠 SIHİRLİ DOKUNUŞ: Resmi asenkron olarak tamamen belleğe yüklüyoruz.
            // Bu sayede "The source image cannot be decoded" hatası %100 engellenir.
            const sanalGorsel = await sanalGorselYukle(dosya);

            const gizliCanvas = document.createElement('canvas');
            const ctx = gizliCanvas.getContext('2d');
            gizliCanvas.width = 224;
            gizliCanvas.height = 224;
            ctx.drawImage(sanalGorsel, 0, 0, 224, 224);
            
            const tensorGorsel = tf.browser.fromPixels(gizliCanvas);
            const tahminler = await yapayZekaModeli.classify(tensorGorsel);
            tensorGorsel.dispose(); 
            

            const kahveKelimeleri = ['cup', 'mug', 'saucer', 'coffee', 'espresso', 'tableware', 'pottery', 'bowl', 'chalice', 'pitcher', 'vase'];
            
            tahminler.forEach(tahmin => {
                
                if (tahmin.probability > 0.25) { 
                    kahveKelimeleri.forEach(kelime => {
                        if (tahmin.className.toLowerCase().includes(kelime)) {
                            fincanBulunduMu = true;
                        }
                    });
                }
            });
        } catch (hata) {
            fincanBulunduMu = true; // Kütüphane çökerse kullanıcıyı engelleme, bypass et
        }
    } else {
        fincanBulunduMu = true;
    }


   
    if (!fincanBulunduMu) {
        if(durumMesaji) durumMesaji.innerText = "";
        alert("Resimde fal resmi (kahve fincanı/tabağı) bulunamadı. Lütfen geçerli bir görsel yükleyin!");
        return; 
    }

        const buton = document.getElementById('buton');
        buton.innerText = "Fal Okunuyor...";
        buton.disabled = true;

    // ─── 2. ADIM: FORM BİLGİLERİNİ ALMA VE HAZIRLAMA ───
    const formData = new FormData(falFormu);
    const isim = formData.get('isim');
    const yas = formData.get('yas');

    if (!/^\d+$/.test(yas)) {
        alert("Lütfen yaş alanına sadece sayı giriniz!");
        return; 
    }
    
    const durumSecimi = document.getElementById('plan-secimi');
    const meslek = durumSecimi.options[durumSecimi.selectedIndex].text;

    const Base64Resim = await resmiBase64eCevir(dosya);

    const prompt = `Adım ${isim}, ${yas} yaşındayım, ${meslek} mesleği ile uğraşıyorum. 
    Sana bir adet fal görseli gönderdim bu falı tıpkı bir falcı gibi yorumla. Bana ismimle
    hitap et ve fal yorumun maksimum 3 paragraf büyüklüğünde olsun. Fal yorumu içinde emojiler kullanma.`;

    const istekGovdesi = {
        promptMetni: prompt,
        base64Resim: Base64Resim
    };
    
    // ─── 3. ADIM: BACKEND İLETİŞİMİ VE YEREL JSON YEDEK PLANI ───
    try {
        if(durumMesaji) durumMesaji.innerText = "Yapay zeka falınızı yorumluyor...";

        const response = await fetch('http://localhost:8080/api/fal-bak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(istekGovdesi)
        });

        if(!response.ok){
            throw new Error(`Sunucu Hatası: ${response.status}`);
        }

        const data = await response.json();
        const falYorumu = data.candidates[0].content.parts[0].text;

        if(durumMesaji) durumMesaji.innerText = "";

        let fal = `<h2 class="basliklar"> Merhaba, ${isim} Fal Yorumun</h2>
        <p class="fal_cumlesi">${falYorumu.replace(/\n/g, '<br>')}</p>`;
        ana_div.innerHTML = fal;
        stroageVeriEkleme(fal);

        buton.disabled = false;
        buton.innerText = "Fal Baktır";


        ana_div.scrollIntoView({ behavior: 'smooth' });

    } catch(e) {
        
        if(durumMesaji) durumMesaji.innerText = "Yıldızlar yoğun, yerel bilge devreye giriyor...";
        
        const planSecimi = document.getElementById('plan-secimi').value;
        let yas_enum;
        let meslek_enum;
        if(yas > 0 && yas <= 25) yas_enum = 1;
        if(yas <= 50 && yas > 25) yas_enum = 2;
        if(yas > 50) yas_enum = 3;
        if(planSecimi == "ogrenci") meslek_enum = 1;
        if(planSecimi == "calisan") meslek_enum = 2;
        if(planSecimi == "issiz") meslek_enum = 3;

        await jsondanRastgeleVeriCek(yas_enum, meslek_enum, isim);
    }
});

// 🔄 Yardımcı Fonksiyon: Resmi asenkron olarak belleğe hatasız yükler
function sanalGorselYukle(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = e.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

async function jsondanRastgeleVeriCek(yas_enum, meslek_enum, isim) {
    try {
        const cevap = await fetch('yorumlar.json');
        const tumYorumlar = await cevap.json(); 
        
        const ask_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && satir.tarz == 1);
        const rastgeleIndeks1 = Math.floor(Math.random() * ask_yorumlar.length);
        const ask_yorumu = ask_yorumlar[rastgeleIndeks1];

        const is_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && satir.tarz == 2);
        const rastgeleIndeks2 = Math.floor(Math.random() * is_yorumlar.length);
        const is_yorumu = is_yorumlar[rastgeleIndeks2];

        const aile_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && ('tarz' in satir ? satir.tarz == 3 : satir['tarz:'] == 3));
        const rastgeleIndeks3 = Math.floor(Math.random() * (aile_yorumlar.length > 0 ? aile_yorumlar.length : 1));
        const aile_yorumu = aile_yorumlar.length > 0 ? aile_yorumlar[rastgeleIndeks3] : { yorum: "Aile hayatınızda bu dönem yapıcı ve sakin kalmanız gereken bir süreç." };

        const gelecek_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && ('tarz' in satir ? satir.tarz == 4 : satir['tarz :'] == 4 || satir['tarz:'] == 4));
        const rastgeleIndeks4 = Math.floor(Math.random() * (gelecek_yorumlar.length > 0 ? gelecek_yorumlar.length : 1));
        const gelecek_yorumu = gelecek_yorumlar[rastgeleIndeks4];

        const para_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && ('tarz' in satir ? satir.tarz == 5 : satir['tarz :'] == 5 || satir['tarz:'] == 5));
        const rastgeleIndeks5 = Math.floor(Math.random() * (para_yorumlar.length > 0 ? para_yorumlar.length : 1));
        const para_yorumu = para_yorumlar.length > 0 ? para_yorumlar[rastgeleIndeks5] : { yorum: "Maddi konularda harcamalarınıza dikkat etmeniz gereken bir dönem." };

        if(durumMesaji) durumMesaji.innerText = "";

        let fal =  `
            <h2 class="basliklar"> Merhaba, ${isim} Fal Yorumun</h2>
            <p class="fal_cumlesi">${ask_yorumu ? ask_yorumu.yorum : "Aşk hayatında sürpriz gelişmeler kapıda."}</p>
            <p class="fal_cumlesi">${is_yorumu ? is_yorumu.yorum : "Kariyer hedeflerinde doğru adımlarla ilerliyorsun."}</p>
            <p class="fal_cumlesi">${aile_yorumu.yorum}</p>
            <p class="fal_cumlesi">${gelecek_yorumu.yorum}</p>
            <p class="fal_cumlesi">${para_yorumu.yorum}</p>
        `;

        ana_div.innerHTML = fal;
        stroageVeriEkleme(fal);
        
        ana_div.scrollIntoView({ behavior: 'smooth' });

        buton.disabled = false;
        buton.innerText = "Fal Baktır";
        
    } catch (hata) {
        console.error("JSON okunurken bir hata oluştu:", hata);
        if(durumMesaji) durumMesaji.innerText = "";
        alert("Sistem şu an meşgul, lütfen daha sonra tekrar deneyiniz.");
    }
}

function resmiBase64eCevir(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const safBase64 = reader.result.split(',')[1];
            resolve(safBase64);
        };
        reader.onerror = error => reject(error);
    });
}

function stroageVeriEkleme(fal){
    let todos = [];
    if(localStorage.getItem("todos") === null){
        todos = [];
    }
    else{
        todos = JSON.parse(localStorage.getItem("todos"));
    }

    todos.unshift(fal);
    localStorage.setItem("todos",JSON.stringify(todos));
    stroageVeriGetirme();
    
}

function stroageVeriGetirme(){

    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    const gecmisAlan = document.getElementById('gecmisAlan');
    const fal_listele = document.getElementById('fal_listele');
    const fal_sil = document.getElementById('fal_sil');

    if(gecmisAlan){
        gecmisAlan.innerHTML="";
    
     if(todos!=null && todos.length!=0){

        fal_listele.classList.add('buton');
        fal_listele.style.display ='block';
        fal_listele.innerText = 'Geçmiş Falları Lisele';
        let tiklama_sayisi = 0;
        fal_listele.addEventListener('click',function(){
            tiklama_sayisi++;
            
            if(tiklama_sayisi % 2 !=0){
            
            fal_listele.innerText = 'Geçmiş Falları Kapat';
            gecmisAlan.innerHTML = "";

            for(let i=0;i<todos.length;i++){
            const yeniDiv = document.createElement('div');
            yeniDiv.classList.add('form_kutusu','aktif');
            yeniDiv.style.alignContent = 'center';
            yeniDiv.innerHTML = todos[i];

            gecmisAlan.appendChild(yeniDiv);
                }

            }

            if(tiklama_sayisi % 2 ==0){
                
                fal_listele.innerText = 'Geçmiş Falları Göster';
                gecmisAlan.innerHTML = "";
                
            }
            console.log(tiklama_sayisi);
        })

        
        fal_sil.classList.add('buton');
        fal_sil.style.display='block';
        fal_sil.innerText = "Fal Geçmişini Temizle";
        fal_sil.addEventListener('click', function(){

            localStorage.removeItem("todos");
            fal_listele.style.display = 'none';
            fal_sil.style.display = 'none'
            gecmisAlan.innerHTML = "";
            tiklama_sayisi = 0; 
            fal_listele.innerText = 'Geçmiş Falları Listele';
        })

     }
    }
}

document.addEventListener('DOMContentLoaded', stroageVeriGetirme);
