class User {
  int? id;
  String? email;
  String? firstName;
  String? lastName;
  String? tipoUsuario;
  String? fotoPerfil;
  String? telefone;

  User({
    this.id,
    this.email,
    this.firstName,
    this.lastName,
    this.tipoUsuario,
    this.fotoPerfil,
    this.telefone
  });

  User.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    email = json['email'];
    firstName = json['first_name'];
    lastName = json['last_name'];
    tipoUsuario = json['tipo_usuario'];
    fotoPerfil = json['foto_perfil'];
    telefone = json['telefone'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['email'] = email;
    data['first_name'] = firstName;
    data['last_name'] = lastName;
    data['tipo_usuario'] = tipoUsuario;
    data['foto_perfil'] = fotoPerfil;
    data['telefone'] = telefone;
    return data;
  }
}
