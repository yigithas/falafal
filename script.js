const myForm = document.getElementById('myForm');
const falResmiInput = document.getElementById('falResmi'); 
const resimOnizleme = document.getElementById('resimOnizleme');
const durumMesaji = document.getElementById('durumMesaji'); 
const ana_div = document.getElementById('ana_div');

let yapayZekaModeli = null;

// Modeli yükleyen ana asenkron fonksiyon
async function modeliYukle() {
    try {
        if(durumMesaji) durumMesaji.innerText = "Yapay zeka modeli yükleniyor, lütfen bekleyin...";
        
        // [KRİTİK İOS ÇÖZÜMÜ]: Tarayıcı motorunu CPU moduna zorluyoruz.
        // Bu sayede iPhone (Safari/Chrome) grafik motorunun pikselleri sıfır (NaN) okuma hatası tamamen bypass edilir.
        await tf.setBackend('cpu');
        await tf.ready(); 
        
        // Modeli yükle
        yapayZekaModeli = await mobilenet.load();
        
        if(durumMesaji) durumMesaji.innerText = "Model hazır! Bilgilerini girip falına bakabilirsin.";
        console.log("TensorFlow CPU modunda ayağa kalktı ve MobileNet başarıyla yüklendi.");
    } catch (hata) {
        console.error("Model yüklenirken bir hata oluştu:", hata);
        if(durumMesaji) durumMesaji.innerText = "Yapay zeka yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.";
    }
}
// Sayfa açılır açılmaz fonksiyonu tetikle
modeliYukle();

// Dosya yükleme alanını dinle
falResmiInput.addEventListener('change', function(event) {
    const dosya = event.target.files[0];
    if (dosya) {
        const okuyucu = new FileReader();
        okuyucu.onload = function(e) {
            resimOnizleme.src = e.target.result;
            resimOnizleme.style.display = "none"; // İstediğin gibi ön izlemeyi ekranda tamamen gizledik
        }
        okuyucu.readAsDataURL(dosya);
    }
});

// Form gönderildiğinde çalışacak alan
myForm.addEventListener('submit', async function(event){
    event.preventDefault(); 

    if (!yapayZekaModeli) {
        alert("Yapay Zeka henüz yüklenmedi veya arka planda hazırlanıyor, lütfen birkaç saniye bekleyin.");
        return;
    }

    if (falResmiInput.files.length === 0 || !resimOnizleme.src) {
        alert("Lütfen bir kahve fincanı fotoğrafı yükleyin!");
        return;
    }

    if(durumMesaji) durumMesaji.innerText = "Fincanınız yapay zeka tarafından inceleniyor...";

    let tahminler = [];
    
    try {
        // Resmin pikselleri tarayıcı hafızasında tamamen çözülene kadar bekle
        if ('decode' in resimOnizleme) {
            await resimOnizleme.decode();
        }

        // Arka planda steril bir standart canvas oluştur
        const gizliCanvas = document.createElement('canvas');
        const ctx = gizliCanvas.getContext('2d');
        
        gizliCanvas.width = 224;
        gizliCanvas.height = 224;
        
        // Resmi tam boyutlarıyla canvas üzerine bas
        ctx.drawImage(resimOnizleme, 0, 0, 224, 224);
        
        // Steril canvas verisini CPU backend üzerinden yapay zekaya besle
        const tensorGorsel = tf.browser.fromPixels(gizliCanvas);
        tahminler = await yapayZekaModeli.classify(tensorGorsel);
        tensorGorsel.dispose(); // RAM sızıntısını önlemek için tensor'ü işi bitince sil
        
    } catch (hata) {
        console.error("Görsel işleme hatası, yedek yönteme geçiliyor:", hata);
        tahminler = await yapayZekaModeli.classify(resimOnizleme);
    }
    
    // Genişletilmiş ve optimize edilmiş kahve/fincan kelime havuzu
    const kahveKelimeleri = ['cup', 'mug', 'saucer', 'coffee', 'espresso', 'tableware', 'pottery', 'bowl', 'chalice', 'pitcher', 'vase'];
    let fincanBulunduMu = false;

    tahminler.forEach(tahmin => {
        // CPU modunda okuma çok net olacağı için barajı güvenli bir şekilde %8'e çektik
        if (tahmin.probability > 0.08) {
            kahveKelimeleri.forEach(kelime => {
                if (tahmin.className.toLowerCase().includes(kelime)) {
                    fincanBulunduMu = true;
                }
            });
        }
    });

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

                const aile_yorumlar = tumYorumlar.filter(satir => satir.yas == yas_enum && satir.meslek == meslek_enum && satir.tarz==3);
                // Aile tarzında json'daki minik isimlendirme açıklarına karşı güvenlik önlemi
                const rastgeleIndeks3 = Math.floor(Math.random() * (aile_yorumlar.length > 0 ? aile_yorumlar.length : 1));
                const aile_yorumu = aile_yorumlar.length > 0 ? aile_yorumlar[rastgeleIndeks3] : { yorum: "Aile hayatınızda bu dönem yapıcı ve sakin kalmanız gereken bir süreç." };

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