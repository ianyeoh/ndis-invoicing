import { createContext, useState, useEffect, useContext, useRef } from "react";
import DragSelect, { DSInputElement } from "dragselect";
import "./drag-select-styling.css";

type ProviderProps = {
    children: React.ReactNode;
    settings?: ConstructorParameters<typeof DragSelect<DSInputElement>>[0];
};

const Context = createContext<{
    dragSelect: DragSelect<DSInputElement> | undefined;
    disable: () => void;
    enable: () => void;
}>({
    dragSelect: undefined,
    disable: () => {},
    enable: () => {},
});

function DragSelectProvider({ children, settings = {} }: ProviderProps) {
    const [ds, setDS] = useState<DragSelect<DSInputElement>>();
    const [enabled, setEnabled] = useState<boolean>(true);

    useEffect(() => {
        setDS((prevState) => {
            if (prevState) return prevState;
            return new DragSelect({
                ...settings,
                customStyles: true,
            });
        });

        return () => {
            if (ds) {
                ds.stop();
                setDS(undefined);
            }
        };
    }, []);

    useEffect(() => {
        if (enabled) {
            ds?.setSettings({
                selectorClass: "ds-selector-box",
            });
        } else {
            ds?.setSettings({
                selectorClass: "ds-selector-hide",
            });
        }
    }, [ds, enabled]);

    useEffect(() => {
        ds?.setSettings(settings);
    }, [ds, settings]);

    return (
        <Context.Provider
            value={{
                dragSelect: ds,
                disable: () => {
                    setEnabled(false);
                },
                enable: () => {
                    setEnabled(true);
                },
            }}
        >
            {children}
        </Context.Provider>
    );
}

function useDragSelect() {
    return useContext(Context);
}

export { DragSelectProvider, useDragSelect };
