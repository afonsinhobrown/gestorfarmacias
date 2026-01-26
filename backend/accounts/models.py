from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError(_('O email deve ser fornecido'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model with email as the unique identifier."""
    
    class TipoUsuario(models.TextChoices):
        ADMIN = 'ADMIN', _('Administrador')
        FARMACIA = 'FARMACIA', _('Farmácia')
        CLIENTE = 'CLIENTE', _('Cliente')
        ENTREGADOR = 'ENTREGADOR', _('Entregador')
        FORNECEDOR = 'FORNECEDOR', _('Fornecedor')
    
    username = None  # Remove username field
    email = models.EmailField(_('email'), unique=True)
    tipo_usuario = models.CharField(
        _('tipo de usuário'),
        max_length=20,
        choices=TipoUsuario.choices,
        default=TipoUsuario.CLIENTE
    )
    telefone = models.CharField(_('telefone'), max_length=20, blank=True)
    foto_perfil = models.ImageField(
        _('foto de perfil'),
        upload_to='perfis/',
        blank=True,
        null=True
    )
    foto_documento = models.ImageField(
        _('foto do documento'),
        upload_to='documentos/',
        blank=True,
        null=True
    )
    endereco = models.TextField(_('endereço'), blank=True)
    cidade = models.CharField(_('cidade'), max_length=100, blank=True)
    provincia = models.CharField(_('província'), max_length=100, blank=True)
    codigo_postal = models.CharField(_('código postal'), max_length=20, blank=True)
    
    # Geolocalização
    latitude = models.DecimalField(
        _('latitude'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    longitude = models.DecimalField(
        _('longitude'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    
    # Metadata
    data_criacao = models.DateTimeField(_('data de criação'), auto_now_add=True)
    data_atualizacao = models.DateTimeField(_('data de atualização'), auto_now=True)
    is_verificado = models.BooleanField(_('verificado'), default=False)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = _('usuário')
        verbose_name_plural = _('usuários')
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip() or self.email
