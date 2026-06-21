"""Abstract platform interface — keeps room for FreeSWITCH/Kamailio later."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Dict


class VoipPlatform(ABC):
    name: str = "abstract"

    @abstractmethod
    def config_dir(self) -> str: ...

    @abstractmethod
    def service_unit(self) -> str: ...

    @abstractmethod
    def render_signalling_config(self, inventory) -> str: ...

    @abstractmethod
    def render_dialplan(self, inventory) -> str: ...

    @abstractmethod
    def render_rtp_config(self, inventory) -> str: ...

    @abstractmethod
    def reload_cmd(self) -> list[str]: ...

    def files_to_write(self, inventory) -> Dict[str, str]:
        return {
            "pjsip.conf": self.render_signalling_config(inventory),
            "extensions.conf": self.render_dialplan(inventory),
            "rtp.conf": self.render_rtp_config(inventory),
        }