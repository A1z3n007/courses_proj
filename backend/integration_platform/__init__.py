"""
Package initializer for the integration_platform Django project.
"""

# Django 4.2 не поддерживает Python 3.14 "из коробки". В частности,
# copy.copy(BaseContext) в django.template.context ломается, потому что
# базовый объект больше не имеет атрибутов, созданных через super().
# Чтобы админка и шаблоны не падали с AttributeError, аккуратно
# патчим метод __copy__ базового контекста: создаём новый экземпляр
# и копируем dicts вручную.
try:  # pragma: no cover
    from django.template.context import BaseContext

    def _safe_context_copy(self):
        duplicate = object.__new__(self.__class__)
        duplicate.__dict__ = self.__dict__.copy()
        duplicate.dicts = self.dicts[:]
        return duplicate

    BaseContext.__copy__ = _safe_context_copy  # type: ignore[attr-defined]
except Exception:
    # Если Django ещё не загружен (например, во время сборки), просто
    # пропускаем патч — он применится при первом импорте проекта.
    pass
