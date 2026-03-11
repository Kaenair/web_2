import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// Находим элементы DOM
const fileInput = document.querySelector('input[type="file"]');
const previewContainer = document.getElementById('preview-container');
const hiddenInput = document.getElementById('id_image_data');
const submitBtn = document.getElementById('submit-btn');

// Слушаем изменение файла
if (fileInput) {
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Создаём временную ссылку на файл (Blob URL)
            const url = URL.createObjectURL(file);
            generateThumbnail(url, file.name);
        }
    });
}

function generateThumbnail(modelUrl, fileName) {
    previewContainer.innerHTML = 'Генерация...';

    // 1. Настройка сцены (Off-screen render)
    const width = 300;
    const height = 200;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // Белый фон для картинки

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100000);

    // ВАЖНО: preserveDrawingBuffer: true нужен, чтобы сделать скришнот
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Очищаем контейнер и добавляем канвас
    previewContainer.innerHTML = '';
    previewContainer.appendChild(renderer.domElement);

    // Свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // 2. Загрузка — выбираем загрузчик по расширению файла
    const ext = fileName.split('.').pop().toLowerCase();
    let loader;
    if (ext === 'glb' || ext === 'gltf') {
        loader = new GLTFLoader();
    } else if (ext === 'fbx') {
        loader = new FBXLoader();
    } else if (ext === 'obj') {
        loader = new OBJLoader();
    } else {
        previewContainer.innerHTML = 'Формат не поддерживается';
        return;
    }

    loader.load(modelUrl, (result) => {
        const model = result.scene ? result.scene : result;

        // Центруем (используем упрощенную логику из прошлых уроков)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        model.position.sub(center); // Центр в 0,0,0
        scene.add(model);

        // Ставим камеру
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
        camera.position.set(cameraZ * 0.5, cameraZ * 0.5, cameraZ);
        camera.lookAt(0, 0, 0);
        camera.near = cameraZ / 100;
        camera.far = cameraZ * 20;
        camera.updateProjectionMatrix();

        // 3. Рендер одного кадра — небольшая задержка, чтобы WebGL успел обработать геометрию
        renderer.render(scene, camera);
        setTimeout(() => {
        renderer.render(scene, camera);

        // 4. Фотографирование (Canvas -> Base64 String)
        const dataURL = renderer.domElement.toDataURL('image/jpeg', 0.8); // 0.8 - качество JPG

        // 5. Сохраняем строку в скрытый инпут
        hiddenInput.value = dataURL;

        // Разблокируем кнопку
        submitBtn.disabled = false;
        submitBtn.innerText = 'Загрузить в базу';

        console.log("Скриншот создан!");

        // Очищаем память (URL.createObjectURL создаёт утечки памяти, если не очищать)
        URL.revokeObjectURL(modelUrl);
        }, 100); // конец setTimeout — 100мс достаточно для WebGL

    }, undefined, (err) => {
        console.error(err);
        previewContainer.innerHTML = 'Ошибка генерации превью';
    });
}
