/**
 * Social Hub Module — LifeOS
 * Manages social media profiles, quick-launch connectivity, and direct media call integrations (Zoom, Teams, Meet, WhatsApp).
 */

export function renderSocial(container) {
    // Sample connected social and communication platforms data
    const socialChannels = [
        {
            id: 1,
            name: 'LinkedIn',
            handle: '@firas-aldefae',
            category: 'Professional',
            icon: 'fa-brands fa-linkedin-in',
            color: '#0a66c2',
            actionUrl: 'https://www.linkedin.com',
            actionLabel: 'Open Profile'
        },
        {
            id: 2,
            name: 'Zoom Meetings',
            handle: 'Instant Video Rooms',
            category: 'Video Calls',
            icon: 'fa-solid fa-video',
            color: '#2d8cff',
            actionUrl: 'https://zoom.us/start/videomeeting',
            actionLabel: 'Start Zoom Call'
        },
        {
            id: 3,
            name: 'Microsoft Teams',
            handle: 'Enterprise Comms',
            category: 'Video Calls',
            icon: 'fa-brands fa-microsoft',
            color: '#6264a7',
            actionUrl: 'https://teams.microsoft.com',
            actionLabel: 'Launch Teams'
        },
        {
            id: 4,
            name: 'Google Meet',
            handle: 'Quick Video Room',
            category: 'Video Calls',
            icon: 'fa-solid fa-headset',
            color: '#00875a',
            actionUrl: 'https://meet.google.com/new',
            actionLabel: 'New Meet Call'
        },
        {
            id: 5,
            name: 'WhatsApp Call',
            handle: '+971 50 000 0000',
            category: 'Messaging & Calls',
            icon: 'fa-brands fa-whatsapp',
            color: '#25d366',
            actionUrl: 'https://web.whatsapp.com',
            actionLabel: 'Open WhatsApp'
        },
        {
            id: 6,
            name: 'Instagram',
            handle: 'Photo & Video Sharing',
            category: 'Social Media',
            icon: 'fa-brands fa-instagram',
            color: '#e1306c',
            actionUrl: 'https://www.instagram.com',
            actionLabel: 'Open Instagram'
        },
        {
            id: 7,
            name: 'Snapchat',
            handle: 'Messages & Stories',
            category: 'Social Media',
            icon: 'fa-brands fa-snapchat',
            color: '#fffc00',
            actionUrl: 'https://www.snapchat.com',
            actionLabel: 'Open Snapchat'
        },
        {
            id: 8,
            name: 'X',
            handle: 'News & Conversations',
            category: 'Social Media',
            icon: 'fa-brands fa-x-twitter',
            color: '#111111',
            actionUrl: 'https://x.com',
            actionLabel: 'Open X'
        }
    ];

    container.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto; font-family: var(--font-sans);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 4px;">Social & Communication Hub</h2>
                    <p style="color: var(--color-muted); font-size: 0.95rem;">Connect with your networks and instantly launch video calls or media channels.</p>
                </div>
                <button class="btn-primary" id="add-social-btn"><i class="fa-solid fa-plus"></i> Add Channel</button>
            </div>

            <!-- Quick Communication Banner -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 16px; padding: 24px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; box-shadow: var(--shadow-md);">
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;"><i class="fa-solid fa-bolt"></i> Instant Meeting Room</h3>
                    <p style="opacity: 0.9; font-size: 0.9rem; max-width: 600px;">Launch a secure conference call immediately via Zoom or Google Meet without leaving your LifeOS workspace.</p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <a href="https://zoom.us/start/videomeeting" target="_blank" class="btn-primary" style="background: #ffffff; color: #4f46e5; display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">
                        <i class="fa-solid fa-video"></i> Start Zoom
                    </a>
                    <a href="https://meet.google.com/new" target="_blank" class="btn-secondary" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: #ffffff; display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">
                        <i class="fa-solid fa-video"></i> Google Meet
                    </a>
                </div>
            </div>

            <!-- Channels Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
                ${socialChannels.map(channel => `
                    <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s ease, box-shadow 0.2s ease; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 0; left: 0; height: 4px; width: 100%; background: ${channel.color};"></div>
                        
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: ${channel.color}15; color: ${channel.color}; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                                    <i class="${channel.icon}"></i>
                                </div>
                                <span class="badge" style="background: ${channel.color}15; color: ${channel.color};">${channel.category}</span>
                            </div>
                            <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">${channel.name}</h3>
                            <p style="color: var(--color-muted); font-size: 0.875rem; margin-bottom: 20px;">${channel.handle}</p>
                        </div>

                        <div>
                            <a href="${channel.actionUrl}" target="_blank" style="display: block; text-align: center; background: var(--color-background); border: 1px solid var(--color-border); color: var(--color-text); padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: background 0.2s;" onmouseover="this.style.background='var(--color-surface-hover)'" onmouseout="this.style.background='var(--color-background)'">
                                ${channel.actionLabel} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem; margin-left: 6px; opacity: 0.7;"></i>
                            </a>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Interactive button binding for custom channels
    container.querySelector('#add-social-btn').onclick = () => {
        const platformName = prompt('Enter platform name (e.g., Telegram, Discord, Skype):');
        if (!platformName) return;
        const linkUrl = prompt('Enter meeting or profile URL:', 'https://');
        if (!linkUrl) return;
        
        alert(`Successfully registered ${platformName}! Ready for integration.`);
    };
}