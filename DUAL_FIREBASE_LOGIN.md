# 🔐 Sistema de Login Unificado - Dual Firebase

## 📋 Resumen de Arquitectura

Tu aplicación ahora tiene **Login Unificado** que autentica automáticamente en **AMBOS proyectos Firebase** con las mismas credenciales de administrador.

### Proyectos Firebase

| Proyecto | Descripción | Base de Datos | Uso |
|----------|-------------|---------------|-----|
| **Proyecto A (Principal)** | Negocio | `dbNegocio` | Productos, categorías, configuración |
| **Proyecto B (Clientes)** | Pedidos | `dbPedidos` | Pedidos, usuarios_clientes |

---

## 🎯 Cómo Funciona el Login Unificado

### Cuando el admin hace login:
```javascript
// En Login.jsx, el usuario llena:
email: "admin@bodeguita.com"
password: "contraseña123"

// AuthContext ejecuta automáticamente:
1. ✅ signInWithEmailAndPassword(auth, email, password)        // Proyecto A
2. ✅ signInWithEmailAndPassword(authPedidos, email, password) // Proyecto B

// Resultado: ¡Acceso SIMULTÁNEO a ambos proyectos!
```

### Estado de Autenticación
- El usuario **NO necesita hacer nada diferente** en el formulario de login
- La autenticación dual ocurre **en segundo plano**
- Si falla en cualquier proyecto, el login completo falla

---

## 💻 Cómo Usar las Bases de Datos

### Opción 1: Importar donde las necesites

```javascript
// Para acceder al PROYECTO A (Negocio)
import { dbNegocio } from '../firebase/firebase';

// Para acceder al PROYECTO B (Pedidos)
import { dbPedidos } from '../firebase/firebaseConfig';

// Ejemplo: Obtener productos (Proyecto A)
const productosSnapshot = await getDocs(collection(dbNegocio, 'productos'));

// Ejemplo: Obtener pedidos (Proyecto B)
const pedidosSnapshot = await getDocs(collection(dbPedidos, 'pedidos'));
```

### Opción 2: Usar en contextos/componentes

```javascript
import { dbNegocio } from '../firebase/firebase';
import { dbPedidos } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

// En un componente o contexto
const fetchProductos = async () => {
  const productosRef = collection(dbNegocio, 'productos');
  const snapshot = await getDocs(productosRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchPedidos = async () => {
  const pedidosRef = collection(dbPedidos, 'pedidos');
  const snapshot = await getDocs(pedidosRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

---

## 🔒 Logout Unificado

El logout también cierra sesión en **AMBOS proyectos automáticamente**:

```javascript
const { logout } = useAuth();

const handleLogout = async () => {
  await logout(); // Cierra sesión en Proyecto A y Proyecto B
  navigate('/login');
};
```

---

## 📦 Exports Disponibles

### Desde `firebase.js` (Proyecto A - Negocio)
```javascript
import { 
  auth,        // Autenticación Proyecto A
  dbNegocio,   // Firestore Proyecto A (productos, categorías, etc.)
  db,          // Alias de dbNegocio (compatibilidad)
  storage,     // Storage del Proyecto A
  analytics    // Analytics
} from '../firebase/firebase';
```

### Desde `firebaseConfig.js` (Proyecto B - Pedidos)
```javascript
import { 
  authPedidos,      // Autenticación Proyecto B (usado en AuthContext)
  dbPedidos,        // Firestore Proyecto B (pedidos, usuarios_clientes)
  pedidosDatabase,  // Realtime Database Proyecto B
  yapeDb            // Firestore de Yape (pagos)
} from '../firebase/firebaseConfig';
```

---

## ✅ Beneficios

1. **Un solo login** para acceder a todo
2. **Acceso transparente** a ambas bases de datos
3. **Seguridad mejorada** - autenticación dual
4. **Código limpio** - importas lo que necesitas donde lo necesitas

---

## 🚀 Ejemplo Práctico Completo

```javascript
// src/components/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { dbNegocio } from '../firebase/firebase';
import { dbPedidos } from '../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const Dashboard = () => {
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    // Cargar productos desde Proyecto A
    const fetchProductos = async () => {
      const snapshot = await getDocs(collection(dbNegocio, 'productos'));
      setProductos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    // Cargar pedidos desde Proyecto B
    const fetchPedidos = async () => {
      const snapshot = await getDocs(collection(dbPedidos, 'pedidos'));
      setPedidos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchProductos();
    fetchPedidos();
  }, []);

  return (
    <div>
      <h2>Productos (Proyecto A): {productos.length}</h2>
      <h2>Pedidos (Proyecto B): {pedidos.length}</h2>
    </div>
  );
};
```

---

## ⚠️ Notas Importantes

1. **Usuario debe existir en AMBOS proyectos** con el mismo email y contraseña
2. Si el login falla en cualquier proyecto, el login completo falla
3. `dbNegocio` y `dbPedidos` son **instancias independientes** de Firestore
4. Cada proyecto tiene su propia autenticación, pero se gestionan juntas

---

## 🐛 Troubleshooting

### Error: "Firebase: Error (auth/user-not-found)"
- **Causa**: El usuario no existe en uno de los proyectos
- **Solución**: Asegúrate de crear el usuario en AMBOS proyectos con el mismo email/password

### Error: "Firebase: Error (auth/wrong-password)"
- **Causa**: La contraseña no coincide en uno de los proyectos
- **Solución**: Verifica que la contraseña sea idéntica en ambos proyectos

### Los datos no aparecen
- **Verifica que estás importando la DB correcta**:
  - `dbNegocio` para productos, categorías, etc.
  - `dbPedidos` para pedidos y usuarios_clientes

---

## 📞 Soporte

Si tienes dudas:
1. Revisa los `console.log` en AuthContext para ver el flujo de autenticación
2. Verifica que estés usando el Firestore correcto (`dbNegocio` vs `dbPedidos`)
3. Asegúrate de que el usuario existe en ambos proyectos Firebase

---

¡Listo! Tu sistema de Login Unificado está configurado y funcionando. 🎉
