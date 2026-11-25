# PagaPues · División de gastos compartidos

**Aplicación web para repartir gastos de un viaje o una salida en grupo y saldar las deudas con el menor número de pagos.**

![React](https://img.shields.io/badge/React-TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)

---

## Qué resuelve

Cuando varias personas pagan distintos gastos durante un viaje, saber «quién le debe a quién» se vuelve confuso. PagaPues calcula el saldo de cada participante y propone un plan de pagos que salda todas las cuentas con pocas transferencias.

## Cómo funciona

1. Se registran los participantes.
2. Se registra cada gasto: quién pagó, cuánto y entre quiénes se reparte.
3. La aplicación calcula el **saldo neto** de cada persona (lo que pagó menos lo que le corresponde).
4. Un algoritmo **voraz** empareja a quienes más deben con quienes más deben recibir y genera el **plan de pagos**.

## Estructura del proyecto

```
App.tsx
components/
  ParticipantManager.tsx   participantes
  ExpenseList.tsx          gastos registrados
  SettlementPlan.tsx       plan de pagos sugerido
  FriendsProfile.tsx, Modal.tsx, Button.tsx
services/finance.ts        cálculo de saldos y del plan de pagos
types.ts                   modelo de datos
```

## Ejecución local

Requisitos: Node.js 18 o superior.

```bash
npm install
npm run dev
```

## Autoría

**Camilo Andrés Henríquez Noguera**, estudiante de Ingeniería Industrial de la Universidad del Magdalena. Aplicación creada con apoyo de Google AI Studio.
