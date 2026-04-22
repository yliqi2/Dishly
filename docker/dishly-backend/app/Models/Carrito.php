<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Carrito extends Model
{
    protected $table = 'carrito';

    protected $primaryKey = 'id_carrito';

    public $timestamps = false;
}
