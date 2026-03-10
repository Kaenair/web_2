import * as THREE from 'three';
// Подключаем "грузчика" для формата GLB
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// Подключаем "грузчика" для формата FBX
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
// Подключаем "грузчика" для формата OBJ
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// НОВЫЙ ИМПОРТ: Контроллер орбиты
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function mountSimpleCube(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("Контейнер не найден:", containerId);
        return;
    }

    // --- А. СЦЕНА ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Светло-серый фон

    // --- Б. КАМЕРА ---
    // Угол обзора 75, пропорции как у контейнера, видеть от 0.1 до 1000 метров
    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 2; // Отодвигаем камеру чуть назад

    // --- В. РЕНДЕРЕР (Художник) ---
    const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias - сглаживание
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Вставляем "холст" (canvas) внутрь нашего div
    container.innerHTML = ''; // Очищаем текст "Wait..."
    container.appendChild(renderer.domElement);

    // --- Г. ОБЪЕКТ (Куб) ---
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x007bff }); // Синий
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // --- Д. СВЕТ ---
    const light = new THREE.DirectionalLight(0xffffff, 2); // Белый мощный свет
    light.position.set(5, 5, 5);
    scene.add(light);
    // Добавим еще мягкий свет, чтобы тени не были черными
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);


    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        // Обновляем параметры камеры
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        // Обновляем размер холста
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // --- Е. АНИМАЦИЯ (Loop) ---
    function animate() {
        requestAnimationFrame(animate); // Запрашиваем следующий кадр
        // Вращаем куб
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        // Рисуем кадр
        renderer.render(scene, camera);
    }

    // Запуск
    animate();
    console.log("3D сцена запущена в", containerId);
}

export function loadModel(containerId, modelUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Стандартная настройка сцены
    const scene = new THREE.Scene();
    // Фон прозрачный (убираем scene.background, чтобы alpha работал)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // --- 1. Генерируем HTML лоадера программно ---
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'loader-overlay';
    loaderDiv.innerHTML = `
        <div style="color: #666; font-size: 0.9rem;">Loading...</div>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
    `;

    // Убедитесь, что очистка container.innerHTML = '' происходит ДО добавления лоадера
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    container.appendChild(loaderDiv);

    // Находим полоску, чтобы менять её ширину
    const progressFill = loaderDiv.querySelector('.progress-fill');

    // --- ДОБАВЛЯЕМ УПРАВЛЕНИЕ ---
    const controls = new OrbitControls(camera, renderer.domElement);

    // Включаем инерцию (damping), чтобы вращение было плавным, как в Sketchfab
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Ограничиваем зум (чтобы не улететь сквозь модель)
    controls.minDistance = 0.1;
    controls.maxDistance = 50;

    // 2. Свет через PMREMGenerator + RoomEnvironment
    // PMREMGenerator генерирует карту окружения из сцены
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Создаем нейтральную "комнату"
    const roomEnvironment = new RoomEnvironment();

    // Говорим сцене: "Используй эту комнату как источник света и отражений"
    scene.environment = pmremGenerator.fromScene(roomEnvironment).texture;

    // Прямые источники света — для материалов, не поддерживающих environment map
    // (MeshPhongMaterial, MeshLambertMaterial из FBX/OBJ)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(-5, 5, -5);
    scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 3. Определяем формат файла и выбираем загрузчик
    const extension = modelUrl.split('.').pop().toLowerCase();
    let loader;

    if (extension === 'glb' || extension === 'gltf') {
        loader = new GLTFLoader();
    } else if (extension === 'fbx') {
        loader = new FBXLoader();
    } else if (extension === 'obj') {
        loader = new OBJLoader();
    } else {
        console.error("Неподдерживаемый формат:", extension);
        return;
    }

    // Магия центровки — подгоняем камеру под размер модели
    function fitCameraToObject(camera, object, controls) {
        // 1. Вычисляем Bounding Box
        const boundingBox = new THREE.Box3().setFromObject(object);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        // 2. Считаем нужную дистанцию по вертикали и горизонтали
        const fov = camera.fov * (Math.PI / 180);
        const aspect = camera.aspect;

        // Дистанция, чтобы модель влезла по высоте
        const distV = (size.y / 2) / Math.tan(fov / 2);
        // Дистанция, чтобы модель влезла по ширине (учитываем aspect ratio)
        const distH = (size.x / 2) / Math.tan(fov / 2) / aspect;
        // Берём максимум + учитываем глубину модели
        let distance = Math.max(distV, distH, size.z);

        // 3. Отступ — модель не должна упираться в края (×2.0)
        distance *= 2.0;

        // 4. Ставим камеру: прямо перед моделью, чуть выше центра
        camera.position.set(
            center.x,
            center.y + size.y * 0.15,
            center.z + distance
        );

        // 5. near/far подстраиваем под размер
        camera.near = distance / 100;
        camera.far = distance * 20;
        camera.updateProjectionMatrix();

        // 6. OrbitControls вращает вокруг центра модели
        controls.target.copy(center);
        controls.minDistance = distance * 0.3;
        controls.maxDistance = distance * 5;
        controls.update();
    }

    // 4. Загрузка модели
    let loadedModel = null;

    const showError = () => {
        if (!loaderDiv.parentNode) container.appendChild(loaderDiv);
        loaderDiv.style.opacity = '1';
        loaderDiv.innerHTML = `<div class="error-msg">❌ Ошибка загрузки<br><small>Проверьте файл</small></div>`;
    };

    // Сначала проверяем что файл существует, потом грузим
    fetch(modelUrl, { method: 'HEAD' })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            // Файл существует — запускаем загрузку
            loader.load(
                modelUrl,
                (result) => {
            // --- SUCCESS ---
            // GLTFLoader возвращает объект с полем scene, FBXLoader — сразу группу
            loadedModel = result.scene ? result.scene : result;

            // Обрабатываем материалы, чтобы модель корректно отражала свет
            loadedModel.traverse((child) => {
                if (!child.isMesh || !child.material) return;

                const mats = Array.isArray(child.material) ? child.material : [child.material];
                const newMats = mats.map((mat) => {
                    // Phong/Lambert не поддерживают environment map —
                    // конвертируем в Standard для корректного PBR-освещения
                    if (mat.isMeshPhongMaterial || mat.isMeshLambertMaterial) {
                        const stdMat = new THREE.MeshStandardMaterial({
                            color: mat.color,
                            map: mat.map || null,
                            roughness: 0.6,
                            metalness: 0.2,
                            envMap: scene.environment,
                        });
                        mat.dispose();
                        return stdMat;
                    }
                    // Standard/Physical — просто назначаем envMap
                    if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                        mat.envMap = scene.environment;
                        mat.needsUpdate = true;
                    }
                    return mat;
                });
                child.material = newMats.length === 1 ? newMats[0] : newMats;
            });

            // Центровка камеры
            fitCameraToObject(camera, loadedModel, controls);

            scene.add(loadedModel);

            // Скрываем лоадер после загрузки
            loaderDiv.style.opacity = '0';
            setTimeout(() => loaderDiv.remove(), 300);
        },
        // B. ON PROGRESS (Прогресс)
        (xhr) => {
            // xhr.total — общий вес файла в байтах
            // xhr.loaded — сколько скачалось
            if (xhr.total > 0) {
                const percent = (xhr.loaded / xhr.total) * 100;
                progressFill.style.width = percent + '%';
            }
        },
        // C. ON ERROR (Ошибка Three.js)
        (error) => {
            console.error('Ошибка загрузки:', error);
            showError();
        }
    ); // конец loader.load
        }) // конец fetch .then
        .catch(err => {
            console.error('Файл недоступен:', err);
            showError();
        }); // конец fetch

    // 5. Обработка изменения размера окна
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // 6. Анимация
    function animate() {
        requestAnimationFrame(animate);

        // ОБЯЗАТЕЛЬНО: Обновляем контроллер в каждом кадре
        controls.update();

        // Авто-вращение можно убрать или оставить по желанию.
        // Если оставить, оно будет конфликтовать с мышкой.
        // Давайте пока закомментируем авто-вращение:
        // if (loadedModel) loadedModel.rotation.y += 0.005;

        renderer.render(scene, camera);
    }
    animate();
}
