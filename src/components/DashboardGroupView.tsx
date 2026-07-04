import React from 'react';
import { YandexGroup, YandexDevice } from '../types/index';
import { DeviceCard } from './cards/DeviceCard';
import { useDashboardContext } from '../contexts/DashboardContext';
import { UseDashboardStateReturn } from '../hooks/useDashboardState';

interface DashboardGroupViewProps {
    state: UseDashboardStateReturn;
    activeGroupId: string | null;
    groupsForHome: YandexGroup[];
    devicesForHome: YandexDevice[];
}

export const DashboardGroupView: React.FC<DashboardGroupViewProps> = ({
    state,
    activeGroupId,
    groupsForHome,
    devicesForHome,
}) => {
    const ctx = useDashboardContext();

    if (!activeGroupId) return null;
    const group = groupsForHome.find(g => g.id === activeGroupId);
    if (!group) return <div className="empty-state"><p>Группа не найдена</p></div>;

    const groupDevices = devicesForHome.filter(d => group.devices.includes(d.id));
    if (groupDevices.length === 0) return <div className="empty-state"><p>В этой группе нет устройств</p></div>;

    return (
        <div className="device-grid">
            {groupDevices.map(dev => (
                    <DeviceCard
                        key={dev.id}
                        device={dev}
                        onToggle={ctx.onToggleDevice}
                        isFavorite={ctx.favoriteDeviceIds.includes(dev.id)}
                        onToggleFavorite={ctx.onToggleDeviceFavorite}
                        onOpenSettings={state.handleOpenDeviceSettings}
                        onOpenCameraStream={state.openCameraStream}
                        sensorDisplayConfig={state.sensorDisplayConfig}
                    />
                ))}
        </div>
    );
};
