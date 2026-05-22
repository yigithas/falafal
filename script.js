const myForm = document.getElementById('myForm');
const falResmiInput = document.getElementById('falResmi'); 
const resimOnizleme = document.getElementById('resimOnizleme');
const durumMesaji = document.getElementById('durumMesaji'); 
const ana_div = document.getElementById('ana_div');

let yapayZekaModeli = null;
let resimYuklendiMu = false;

// Sayfa açılır açılmaz TensorFlow backend'ini hazırlıyoruz ve modeli yüklüyoruz
async function modeliYukle() {
    try {
        if(durumMesaji) durumMesaji.innerText = "Yapay zeka modeli yükleniyor, lütfen bekleyin...";
        
        // TensorFlow'un web tarayıcı altyapısını hazır hale getirmesini bekliyoruz
        await tf.ready(); 
        
        yapayZekaModeli = await mobilenet.load();
        
        if(durumMesaji) durumMesaji.innerText = "Model hazır! Bilgilerini girip falına bakabilirsin.";
        console.log("TensorFlow ve MobileNet başarıyla yüklendi.");
    } catch (hata) {
        console.error("Model yüklenirken bir hata oluştu:", hata);
        if(durumMesaji) durumMesaji.innerText = "Yapay zeka yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.";
    }
}
modeliYukle();

falResmiInput.addEventListener('change', function(event) {
    const dosya = event.target.files[0];
    if (dosya) {
        resimYuklendiMu = false;
        const okuyucu = new FileReader();
        okuyucu.onload = function(e) {
            resimOnizleme.src = e.target.result;
            resimOnizleme.onload = function() {
                resimYuklendiMu = true;
            }
        }
        okuyucu.readAsDataURL(dosya);
    }
});

myForm.addEventListener('submit', async function(event){
    event.preventDefault(); 

    // A. Önce Model ve Resim Kontrolleri
    if (!yapayZekaModeli) {
        alert("Yapay Zeka henüz yüklenmedi veya arka planda hazırlanıyor, lütfen birkaç saniye bekleyin.");
        return;
    }

    if (falResmiInput.files.length === 0 || !resimYuklendiMu) {
        alert("Lütfen bir kahve fincanı fotoğrafı yükleyin!");
        return;
    }

    if(durumMesaji) durumMesaji.innerText = "Fincanınız yapay zeka tarafından inceleniyor...";

    // B. MobileNet ile Resmi Analiz Etme Kısmı
    let tahminler = [];
    try {
        // iOS ve Android uyumluluğu için pikselleri Tensor formatına çeviriyoruz
        const tensorGorsel = tf.browser.fromPixels(resimOnizleme);
        tahminler = await yapayZekaModeli.classify(tensorGorsel);
        tensorGorsel.dispose(); // Hafıza sızıntısını önlemek için temizliyoruz
    } catch (hata) {
        console.error("Tensor okuma hatası, eski yönteme dönülüyor:", hata);
        tahminler = await yapayZekaModeli.classify(resimOnizleme);
    }
    
    const kahveKelimeleri = ['cup', 'mug', 'saucer', 'coffee', 'espresso', 'tableware', 'pottery'];
    let fincanBulunduMu = false;

    tahminler.forEach(tahmin => {
        // iOS kameraları için olasılık eşiğini 0.12'ye çekerek algılamayı esnettik
        if (tahmin.probability > 0.12) {
            kahveKelimeleri.forEach(kelime => {
                if (tahmin.className.toLowerCase().includes(kelime)) {
                    fincanBulunduMu = true;
                }
            });
        }
    });

    // C. Analiz Sonucuna Göre Karar Verme Kısmı
    if (fincanBulunduMu) {
        if(durumMesaji) durumMesaji.innerText = "Fincan doğrulandı! Falınız hazırlanıyor...";

        const formData = new FormData(myForm);
        let isim = formData.get('isim');
        let yas = formData.get('yas');
        if (!/^\d+$/.test(yas)) {
            alert("Lütfen yaş alanına sadece sayı giriniz!");
            return; 
        }
        const planSecimi = document.getElementById('plan-secimi').value;
        
        ana_div.innerHTML = ``;
        ana_div.classList.add('aktif');

        /*
            Yas : 1:(<25) 2:(25:50) 3:(50<)
            Meslek:  1:(ogrenci) 2:(calisan) 3:(işsiz)
            Tarz : 1:(aşk) 2:(iş/okul) 3:(Aile) 4:(gelecek) 5:(para) 6:(genel)
         */

        let yas_enum;
        let meslek_enum;
        if(yas>0 && yas<=25) yas_enum = 1;
        if(yas<=50 && yas>25) yas_enum = 2;
        if(yas>50) yas_enum = 3;
        if(planSecimi == "ogrenci") meslek_enum = 1;
        if(planSecimi == "calisan") meslek_enum = 2;
        if(planSecimi == "issiz") meslek_enum = 3;
        
        // JSON dosyasını okuyup rastgele veri seçen ana fonksiyon
        async function jsondanRastgeleVeriCek() {
            try {
                const cevap = await fetch('yorumlar.json');
                const tumYorumlar = await cevap.json(); 
                
                const ask_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && satir.tarz==1);
                const rastgeleIndeks1 = Math.floor(Math.random() * ask_yorumlar.length);
                const ask_yorumu = ask_yorumlar[rastgeleIndeks1];

                const is_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && satir.tarz==2);
                const rastgeleIndeks2 = Math.floor(Math.random() * is_yorumlar.length);
                const is_yorumu = is_yorumlar[rastgeleIndeks2];

                const aile_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && satir.tarz==3);
                const rastgeleIndeks3 = Math.floor(Math.random() * aile_yorumlar.length);
                const aile_yorumu = aile_yorumlar[rastgeleIndeks3];

                const gelecek_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && satir.tarz==4);
                const rastgeleIndeks4 = Math.floor(Math.random() * gelecek_yorumlar.length);
                const gelecek_yorumu = gelecek_yorumlar[rastgeleIndeks4];

                const para_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && satir.tarz==5);
                const rastgeleIndeks5 = Math.floor(Math.random() * para_yorumlar.length);
                const para_yorumu = para_yorumlar[rastgeleIndeks5];

                ana_div.innerHTML = `
                    <h2 class="basliklar"> Merhaba, ${isim} Fal Yorumun</h2>
                    <p class="fal_cumlesi">${ask_yorumu.yorum}</p>
                    <p class="fal_cumlesi">${is_yorumu.yorum}</p>
                    <p class="fal_cumlesi">${aile_yorumu.yorum}</p>
                    <p class="fal_cumlesi">${gelecek_yorumu.yorum}</p>
                    <p class="fal_cumlesi">${para_yorumu.yorum}</p>
                `;
                
            } catch (hata) {
                console.error("JSON okunurken bir hata oluştu:", hata);
            }
        }
        jsondanRastgeleVeriCek();

    } else {
        if(durumMesaji) durumMesaji.innerText = "Hata: Bu resim bir kahve fincanına benzemiyor. Lütfen tekrar deneyin.";
        alert("Yüklediğiniz resimde kahve fincanı tespit edilemedi.");
    }
}); 