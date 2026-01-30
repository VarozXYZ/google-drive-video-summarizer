```markdown
# Calorie Tracker - Clase 27 enero - Google Drive

## 1) Timeline: Key Events in Order

- [00:02-01:50] Inicio del proyecto con React y Bit, creación del proyecto llamado "calor tracker", explicación sobre cambiar nombre en package.json y reiniciar servidor.
- [01:50-03:00] Instalación y configuración de Tailwind CSS siguiendo documentación oficial, limpieza de estructura de carpetas y archivos.
- [03:00-07:00] Intentos de instalar librerías externas de componentes UI (SHO, Chat DCN) sin éxito.
- [07:00-11:00] Instalación exitosa de Material UI (Material-UI v7) y sus dependencias (core, styles, icons).
- [11:00-19:00] Creación del componente funcional Calorie Tracker (Ctrck), uso de useState para manejar estado de comida, calorías y entradas; explicación del método reduce para sumar calorías.
- [19:00-31:00] Uso de componentes de Material UI: Card, CardContent, Typography, Box, TextField, Button; explicación de props como sx para estilos inline; estructura JSX del componente.
- [31:00-36:00] Ejemplo práctico de uso del componente con inputs para comida y calorías, botón para añadir entradas y actualización dinámica del total de calorías.
- [36:00-39:00] Discusión sobre uso de librerías externas para UI, importancia de elegir librerías que se adapten al diseño deseado, posibilidad de modificar estilos con Tailwind o usar librerías completas.
- [39:00-47:30] Introducción al hook useEffect para manejar efectos secundarios; explicación de uso para cargar datos desde localStorage al iniciar el componente.
- [47:30-50:30] Uso de useEffect para guardar automáticamente en localStorage cada vez que cambian las entradas; explicación de JSON.stringify y JSON.parse para manejo de datos en localStorage.
- [50:30-51:17] Añadir estado para tipo de comida (desayuno, comida, cena) con constantes en mayúsculas; explicación de convención para constantes hardcode; cierre y pausa de la clase.

---

## 2) Hard Knowledge: Concrete Facts, Definitions, Rules, Steps, Code Patterns, Takeaways

- **Crear proyecto React con Bit:**  
  Comando: `npm create bit@latest`  
  Cambiar nombre en `package.json` y reiniciar servidor si se modifica.

- **Instalación Tailwind CSS:**  
  Seguir pasos oficiales de la documentación Tailwind para integración con React y Bit.  
  Limpiar estructura eliminando carpetas `public`, `assets` para trabajar desde la nube.

- **Uso de librerías UI externas:**  
  Se probó librerías como SHO, Chat DCN sin éxito.  
  Se instaló Material UI (v7) con:  
  - `@mui/material`  
  - `@mui/styles`  
  - `@mui/icons-material`

- **Componentes Material UI usados:**  
  - `Card`, `CardContent`, `Typography`, `Box`, `TextField`, `Button`  
  - Prop `sx` para estilos inline con objeto JS (más potente y limpio que `style` CSS tradicional).  
  - Prop `fullWidth` para inputs que ocupan todo el ancho del contenedor padre.

- **Manejo de estado con React:**  
  - `useState` para variables: `food` (comida), `calories` (calorías), `entries` (array de comidas agregadas), `mealType` (tipo de comida: desayuno, comida, cena).  
  - Función para agregar entrada: verifica que campos no estén vacíos, agrega nueva entrada al array con spread operator, convierte calorías a número, limpia inputs.

- **Sumar calorías:**  
  - Uso de `reduce` para sumar calorías de todas las entradas:  
    ```js
    const totalCalories = entries.reduce((acc, entry) => acc + entry.calories, 0);
    ```

- **Renderizado de lista de entradas:**  
  - Uso de `.map()` para iterar sobre `entries` y mostrar cada comida en un `Box` con estilos Material UI.

- **Uso de useEffect:**  
  - Para cargar datos guardados en `localStorage` al montar el componente:  
    ```js
    useEffect(() => {
      const savedEntries = localStorage.getItem('calorieEntries');
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries));
      }
    }, []);
    ```
  - Para guardar datos en `localStorage` cada vez que cambian las entradas:  
    ```js
    useEffect(() => {
      localStorage.setItem('calorieEntries', JSON.stringify(entries));
    }, [entries]);
    ```

- **Constantes en mayúsculas:**  
  - Convención para valores fijos y globales (hardcode), por ejemplo tipos de comida:  
    ```js
    const MEALS = ['DESAYUNO', 'COMIDA', 'CENA'];
    ```

- **Objetivo diario de calorías:**  
  - Variable `DAILY_GOAL` con valor 2000 kcal para alertar si se supera.

---

## 3) Summary

En esta clase se desarrolló un proyecto de Calorie Tracker usando React y Bit, integrando Tailwind CSS para estilos y Material UI para componentes visuales. Se explicó cómo crear el proyecto, configurar Tailwind y elegir librerías externas para UI, destacando la instalación exitosa de Material UI. Se construyó un componente funcional que maneja el estado de comidas y calorías con