# ⚙️ Web-based Animation State Machine (FSM) Editor

A web-based, interactive 3D Animation State Machine (FSM) editor built for **Babylon.js**.

**Why this project?**
Controlling complex animation flows and state transitions using purely code or Babylon.js's native Inspector can be highly unintuitive and difficult to manage. To solve this, this project adopts the visual, node-based approach of **Unity's Mecanim System**. It allows developers to visually map out animation states, connect transitions, and define blending rules in a highly intuitive web interface, drastically streamlining the 3D character animation workflow.

🔗 **Live Demo:** [https://un1tone.github.io/FSM-Editor/](https://un1tone.github.io/FSM-Editor/)
<img width="1900" height="941" alt="FSM Editor Interface" src="![Image](https://github.com/user-attachments/assets/1f85b212-d6e8-4b84-a7b1-3707c601fe71)" />

## 🛠 Tech Stack

| Category             | Technology                            |
| :------------------- | :------------------------------------ |
| **Core**             | Next.js 14+ (App Router), TypeScript  |
| **3D Engine**        | Babylon.js (`@babylonjs/core`)        |
| **Node Graph**       | React Flow (`@xyflow/react`)          |
| **State Management** | Zustand                               |
| **Styling & UI**     | Tailwind CSS, shadcn/ui, Lucide React |
| **Deployment**       | GitHub Actions (Static HTML Export)   |

## 📖 How to Use

**1. Load a 3D Model**

- Click the **`Load GLB`** button in the Scene Preview panel to import your character model.
- Extracted animation clips will automatically populate the bottom clip list.

**2. Create & Link States**

- Double-click the flow canvas to create a new animation state.
- Assign an animation clip to the node.
- Drag from a node's source handle to another node's target handle to create a **Transition (Edge)**.

**3. Define Transition Rules (Inspector)**

- Click on any edge to open its properties in the right-side **Inspector**.
- **Has Exit Time:** Toggle this and set the normalized `Exit Time` (e.g., `1.0` for 100% completion) to automatically transition when the current animation finishes.
- **Conditions:** Add logical parameters (Triggers, Booleans, Floats) from the left Parameters panel to create conditional branches.

**4. Real-time Preview & Sync**

- The active node is highlighted with a yellow glow.
- Double-click any state node to play it immediately.
- Adjusting `Speed`, `Loop`, or transition `Duration` in the inspector updates the Babylon.js scene in real-time with smooth cross-fading.

**5. Export FSM Logic**

- Once your flow is complete, click **`Export FSM`** in the top right corner.
- This extracts only the connected nodes and logic into a manageable `.txt` template, ready to be integrated into your actual Babylon.js project's logic cycle.

## 📂 File Structure

The project is structured to distinctly separate the React UI logic, the Babylon.js 3D engine, and the Node Graph data.

```bash
├── public/                          # Static assets (Favicon, icons)
├── src/
│   ├── app/                         # Next.js pages and global layout
│   ├── components/
│   │   ├── asm/                     # Core FSM Editor Components
│   │   │   ├── asm-editor.tsx       # Main Layout (Resizable Split Panels)
│   │   │   ├── flow-editor.tsx      # React Flow Node Graph Canvas
│   │   │   ├── babylon-canvas.tsx   # Babylon.js 3D Scene Viewport
│   │   │   ├── parameters-panel.tsx # Transition Variables (Triggers, Bools)
│   │   │   ├── node-inspector.tsx   # State properties editor
│   │   │   └── edge-inspector.tsx   # Transition rules editor
│   │   └── ui/                      # Reusable shadcn/ui generic components
│   ├── hooks/
│   │   └── use-animation-controller.ts # Engine bridge: Syncs Zustand graph data with Babylon AnimationGroups
│   ├── lib/
│   │   └── asm/
│   │       └── store.ts   # Global State Management (Zustand) for Nodes, Edges, and Parameters
│   └── ...
└── next.config.mjs        # Next.js config (Static Export & basePath setup)
```

## 📦 Installation & Local Development

```bash
# 1. Clone the repository
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)

# 2. Navigate to the project directory
cd your-repo-name

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev

# 5. Open in browser
# Visit http://localhost:3000
```
