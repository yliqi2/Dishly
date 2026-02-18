<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LineaCarrito extends Model
{
    protected $table = 'linea_carrito';

    protected $primaryKey = 'id_linea_carrito';

    public $timestamps = false;
}
