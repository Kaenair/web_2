import * as THREE from 'three';
// Подключаем "грузчика" для формата GLB
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// Подключаем "грузчика" для формата FBX
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

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
    scene.background = new THREE.Color(0xf5f5f5); // Цвет фона под карточку

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Очищаем контейнер от текста "Wait..." и вставляем Canvas
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Свет (ВАЖНО! Без него модель будет черной)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Мягкий свет
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2); // Солнце
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // 3. Определяем формат файла и выбираем загрузчик
    const extension = modelUrl.split('.').pop().toLowerCase();
    let loader;

    if (extension === 'glb' || extension === 'gltf') {
        loader = new GLTFLoader();
    } else if (extension === 'fbx') {
        loader = new FBXLoader();
    } else {
        console.error("Неподдерживаемый формат:", extension);
        return;
    }

    // Магия центровки — подгоняем камеру под размер модели
    function fitCameraToObject(camera, object, offset = 1.25) {
        // 1. Вычисляем Bounding Box (коробку, в которую влезает модель)
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(object);

        // 2. Находим центр этой коробки и её размер
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        // 3. Самая длинная сторона модели (чтобы точно влезла)
        const maxDim = Math.max(size.x, size.y, size.z);

        // 4. Смещаем саму модель так, чтобы её центр стал в 0,0,0
        // Вместо того чтобы двигать камеру за моделью, проще притянуть модель к центру мира
        object.position.x = -center.x;
        object.position.y = -center.y; // Теперь модель стоит на "полу" центра
        object.position.z = -center.z;

        // 5. Отодвигаем камеру назад
        // Немного тригонометрии: вычисляем дистанцию в зависимости от угла обзора (FOV)
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        // Умножаем на коэффициент (offset), чтобы модель не упиралась в края экрана
        cameraZ *= offset;

        // Устанавливаем камеру
        camera.position.set(0, maxDim * 0.5, cameraZ); // Чуть выше центра

        // Камера должна смотреть в центр мира (где теперь стоит модель)
        camera.lookAt(0, 0, 0);

        // Динамически подстраиваем near/far под размер модели
        camera.near = cameraZ / 100;
        camera.far = cameraZ * 10;

        // Обновляем параметры камеры
        camera.updateProjectionMatrix();
    }

    // 4. Загрузка модели
    loader.load(
        modelUrl, // URL, который пришел из Django
        (result) => {
            // --- SUCCESS ---
            // GLTFLoader возвращает объект с полем scene, FBXLoader — сразу группу
            const model = result.scene ? result.scene : result;

            // Центровка камеры (Шаг 2)
            fitCameraToObject(camera, model, 1.5);

            scene.add(model);
        },
        undefined, // Progress (можно пропустить)
        (error) => {
            // --- ERROR ---
            console.error('Ошибка загрузки:', error);
            container.innerHTML = '❌ Error';
        }
    );

    // 5. Обработка изменения размера окна
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // 6. Анимация
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();
}
