const myForm = document.getElementById('myForm');
const ana_div = document.getElementById('ana_div');

myForm.addEventListener('submit', async (e) => {

    e.preventDefault();

    const formData = new FormData(myForm);

    const gun = formData.get('gun');
    const ay = formData.get('ay');

    if (!/^\d+$/.test(gun)) {
        alert("Lütfen gün alanına sadece sayı giriniz!");
        return; 
    }

    if (!/^\d+$/.test(ay)) {
        alert("Lütfen ay alanına sadece sayı giriniz!");
        return; 
    }

    getDogumGunuYorumu(ay,gun);


})


// Seçilen ay ve güne göre yorumu getiren fonksiyon
async function getDogumGunuYorumu(ay, gun) {
    try {
        
        const response = await fetch(`https://falafal-backend.onrender.com/api/yorum/list/${gun}/${ay}`);

        
        if (!response.ok) {
            throw new Error(`Sunucu hatası: ${response.status}`);
        }

        
        const veri = await response.json();

        
        console.log("Backend'den Gelen Veri:", veri);

        
        eEkranaYazdir(veri);

        return veri; 

    } catch (error) {
        console.error("İstek atılırken bir hata oluştu:", error);
    }
}

function eEkranaYazdir(veri){

    if(veri!=null){
    
    ana_div.textContent = veri.yorum;
    ana_div.classList.add("fal_cumlesi");
    }
    else{
        ana_div.textContent = "Bu tarih için henüz bir yorum bulunamadı.";
    }




}

