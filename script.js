const myForm = document.getElementById('myForm');
const falResmiInput = document.getElementById('falResmi'); 
const resimOnizleme = document.getElementById('resimOnizleme');
const durumMesaji = document.getElementById('durumMesaji'); 
const ana_div = document.getElementById('ana_div');

let yapayZekaModeli = null;

// Cihazın İPhone / iOS olup olmadığını kontrol eden değişken
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

async function modeliYukle() {
    // Eğer cihaz İPhone ise hiç TensorFlow yükleyip telefonu yormuyoruz ve kilitlemiyoruz
    if (isIOS) {
        if(durumMesaji) durumMesaji.innerText = "Sistem hazır! Bilgilerini girip falına bakabilirsin.";
        console.log("iOS Cihaz: Yapay zeka yüklemesi bypass edildi.");
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

falResmiInput.addEventListener('change', function(event) {
    const dosya = event.target.files[0];
    if (dosya) {
        const okuyucu = new FileReader();
        okuyucu.onload = function(e) {
            resimOnizleme.src = e.target.result;
            resimOnizleme.style.display = "none"; // Önizleme gizli
        }
        okuyucu.readAsDataURL(dosya);
    }
});

myForm.addEventListener('submit', async function(event){
    event.preventDefault(); 

    if (falResmiInput.files.length === 0 || !resimOnizleme.src) {
        alert("Lütfen bir kahve fincanı fotoğrafı yükleyin!");
        return;
    }

    if(durumMesaji) durumMesaji.innerText = "Fincanınız inceleniyor...";

    let fincanBulunduMu = false;

    // Eğer iPhone DEĞİLSE ve model yüklendiyse normal analizi yap
    if (!isIOS && yapayZekaModeli) {
        try {
            if ('decode' in resimOnizleme) {
                await resimOnizleme.decode();
            }
            const gizliCanvas = document.createElement('canvas');
            const ctx = gizliCanvas.getContext('2d');
            gizliCanvas.width = 224;
            gizliCanvas.height = 224;
            ctx.drawImage(resimOnizleme, 0, 0, 224, 224);
            
            const tensorGorsel = tf.browser.fromPixels(gizliCanvas);
            const tahminler = await yapayZekaModeli.classify(tensorGorsel);
            tensorGorsel.dispose(); 
            
            const kahveKelimeleri = ['cup', 'mug', 'saucer', 'coffee', 'espresso', 'tableware', 'pottery', 'bowl', 'chalice', 'pitcher', 'vase'];
            
            tahminler.forEach(tahmin => {
                if (tahmin.probability > 0.05) {
                    kahveKelimeleri.forEach(kelime => {
                        if (tahmin.className.toLowerCase().includes(kelime)) {
                            fincanBulunduMu = true;
                        }
                    });
                }
            });
        } catch (hata) {
            console.error("Analiz hatası:", hata);
            fincanBulunduMu = true; // Hata durumunda kullanıcıyı engelleme
        }
    } else {
        // Cihaz iPhone ise analizi tamamen geç ve doğrudan onay ver
        fincanBulunduMu = true;
    }

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

        let yas_enum;
        let meslek_enum;
        if(yas>0 && yas<=25) yas_enum = 1;
        if(yas<=50 && yas>25) yas_enum = 2;
        if(yas>50) yas_enum = 3;
        if(planSecimi == "ogrenci") meslek_enum = 1;
        if(planSecimi == "calisan") meslek_enum = 2;
        if(planSecimi == "issiz") meslek_enum = 3;
        
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

                const aile_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && ('tarz' in satir ? satir.tarz==3 : satir['tarz:']==3));
                const rastgeleIndeks3 = Math.floor(Math.random() * (aile_yorumlar.length > 0 ? aile_yorumlar.length : 1));
                const aile_yorumu = aile_yorumlar.length > 0 ? aile_yorumlar[rastgeleIndeks3] : { yorum: "Aile hayatınızda bu dönem yapıcı ve sakin kalmanız gereken bir süreç." };

                const gelecek_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && ('tarz' in satir ? satir.tarz==4 : satir['tarz :']==4 || satir['tarz:']==4));
                const rastgeleIndeks4 = Math.floor(Math.random() * (gelecek_yorumlar.length > 0 ? gelecek_yorumlar.length : 1));
                const gelecek_yorumu = gelecek_yorumlar[rastgeleIndeks4];

                const para_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && ('tarz' in satir ? satir.tarz==5 : satir['tarz :']==5 || satir['tarz:']==5));
                const rastgeleIndeks5 = Math.floor(Math.random() * (para_yorumlar.length > 0 ? para_yorumlar.length : 1));
                const para_yorumu = para_yorumlar[rastgeleIndeks5];

                ana_div.innerHTML = `
                    <h2 class="basliklar"> Merhaba, ${isim} Fal Yorumun</h2>
                    <p class="fal_cumlesi">${ask_yorumu ? ask_yorumu.yorum : "Aşk hayatında sürpriz gelişmeler kapıda."}</p>
                    <p class="fal_cumlesi">${is_yorumu ? is_yorumu.yorum : "Kariyer hedeflerinde doğru adımlarla ilerliyorsun."}</p>
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