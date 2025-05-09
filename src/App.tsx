import {Route, Routes} from "react-router-dom";
import NotFoundPage from "./NotFoundPage.tsx";
import Room from "./Room.tsx";
import Administration from "./Administration.tsx";

function App() {


    return (
        <div>
          <Routes>
            <Route path="/:id" element={<Room />} />

            <Route path="/administration" element={<Administration />} />

            {/* Маршрут для всех остальных путей (404 страница).
            Важно: его размещают последним. */}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </div>
    );
}

export default App;
